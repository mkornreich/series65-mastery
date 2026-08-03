package expo.modules.litertlm

import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Content
import com.google.ai.edge.litertlm.Contents
import com.google.ai.edge.litertlm.ConversationConfig
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import com.google.ai.edge.litertlm.SamplerConfig
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import java.io.File

// Runs Google's LiteRT-LM (.litertlm) models fully on-device via the same engine
// the AI Edge Gallery uses. The model file lives on disk (downloaded, or imported
// from the device); LiteRT-LM executes it on GPU (with CPU fallback). No system
// service, allowlist, or network at inference time.
class LitertLmModule : Module() {
  private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
  private var engine: Engine? = null
  private var loadedPath: String? = null

  private fun modelsDir(): File {
    val ctx = appContext.reactContext?.applicationContext
      ?: throw IllegalStateException("No Android application context")
    val dir = File(ctx.getExternalFilesDir(null), "litertlm")
    if (!dir.exists()) dir.mkdirs()
    return dir
  }

  private fun releaseEngine() {
    try {
      engine?.close()
    } catch (_: Throwable) {}
    engine = null
    loadedPath = null
  }

  // LiteRT-LM writes GPU/XNNPACK compile caches next to the model file. A stale
  // cache (e.g. after a reinstall) can make engine creation fail with an internal
  // error; delete them so the next attempt recompiles from scratch.
  private fun clearCaches(modelPath: String) {
    try {
      val f = File(modelPath)
      val dir = f.parentFile ?: return
      val base = f.name
      dir.listFiles()?.forEach { c ->
        if (
          c.name != base &&
          c.name.startsWith(base) &&
          (c.name.contains("cache") || c.name.contains("mldrift") || c.name.endsWith(".bin"))
        ) {
          c.delete()
        }
      }
    } catch (_: Throwable) {}
  }

  private fun createEngine(modelPath: String, useGpu: Boolean, maxTokens: Int): Engine {
    val backend: Backend = if (useGpu) Backend.GPU() else Backend.CPU()
    val e = Engine(
      EngineConfig(modelPath = modelPath, backend = backend, maxNumTokens = maxTokens)
    )
    e.initialize()
    return e
  }

  private fun loadWithRetry(modelPath: String, useGpu: Boolean, maxTokens: Int): Engine {
    return try {
      createEngine(modelPath, useGpu, maxTokens)
    } catch (e1: Throwable) {
      Log.w("LitertLm", "load attempt failed (gpu=$useGpu); clearing caches and recompiling: ${e1.message}")
      clearCaches(modelPath)
      createEngine(modelPath, useGpu, maxTokens)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("LitertLm")

    // Whether the native runtime is present in this build.
    Function("isSupported") { true }

    // Directory (in the app's own external storage, readable without extra
    // permissions) where .litertlm files can be dropped to be picked up.
    Function("modelsDir") { modelsDir().absolutePath }

    // List .litertlm files found in the models dir (on-device / imported models).
    Function("listLocalModels") {
      modelsDir().listFiles { f -> f.isFile && f.name.endsWith(".litertlm") }
        ?.map { it.name } ?: emptyList<String>()
    }

    // Delete an imported .litertlm file (and its compile caches) from our own
    // models dir. Guarded to that directory so it can never touch other files.
    Function("deleteLocalModel") { fileName: String ->
      val dir = modelsDir()
      val f = File(dir, fileName)
      if (!f.exists() || f.parentFile != dir || !fileName.endsWith(".litertlm")) {
        false
      } else {
        if (loadedPath == f.absolutePath) releaseEngine()
        dir.listFiles()?.forEach { c ->
          if (
            c.name != fileName &&
            c.name.startsWith(fileName) &&
            (c.name.contains("cache") || c.name.contains("mldrift") || c.name.endsWith(".bin"))
          ) {
            c.delete()
          }
        }
        f.delete()
      }
    }

    AsyncFunction("load") { modelPath: String, useGpu: Boolean, maxTokens: Int, promise: Promise ->
      scope.launch {
        try {
          releaseEngine()
          engine = loadWithRetry(modelPath, useGpu, maxTokens)
          loadedPath = modelPath
          promise.resolve(true)
        } catch (t: Throwable) {
          Log.w("LitertLm", "load failed (gpu=$useGpu): ${t.javaClass.name}: ${t.message}", t)
          releaseEngine()
          promise.reject("LITERTLM_LOAD_ERROR", t.message ?: "Failed to load model", t)
        }
      }
    }

    AsyncFunction("generate") { prompt: String, system: String, temperature: Double, topK: Int, topP: Double, promise: Promise ->
      scope.launch {
        try {
          val e = engine ?: throw IllegalStateException("No LiteRT-LM model is loaded.")
          val conversation = e.createConversation(
            ConversationConfig(
              systemInstruction = if (system.isNotBlank()) Contents.of(system) else null,
              samplerConfig = SamplerConfig(
                topK = topK,
                topP = topP,
                temperature = temperature,
              ),
            )
          )
          val text = try {
            val msg = conversation.sendMessage(prompt)
            msg.contents.contents
              .filterIsInstance<Content.Text>()
              .joinToString("") { it.text }
              .trim()
          } finally {
            conversation.close()
          }
          promise.resolve(text)
        } catch (t: Throwable) {
          Log.w("LitertLm", "generate failed: ${t.javaClass.name}: ${t.message}", t)
          promise.reject("LITERTLM_GEN_ERROR", t.message ?: "Generation failed", t)
        }
      }
    }

    AsyncFunction("release") { promise: Promise ->
      releaseEngine()
      promise.resolve(null)
    }
  }
}
