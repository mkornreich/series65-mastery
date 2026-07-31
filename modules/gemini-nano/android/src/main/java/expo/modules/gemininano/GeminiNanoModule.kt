package expo.modules.gemininano

import android.content.Context
import android.util.Log
import com.google.ai.edge.aicore.GenerativeModel
import com.google.ai.edge.aicore.generationConfig
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

// A local Expo module that exposes Google's on-device Gemini Nano (via AICore).
// There is no model file to manage — Gemini Nano is provided by the system on
// supported devices (e.g. recent Pixel phones). We create a short-lived
// GenerativeModel per request and close it afterwards. All AICore calls are
// suspend functions, so we run them on a background coroutine and resolve the
// JS Promise with the result.
class GeminiNanoModule : Module() {
  private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

  private fun context(): Context =
    appContext.reactContext?.applicationContext
      ?: throw IllegalStateException("No Android application context available")

  private fun buildModel(temperature: Float, maxTokens: Int): GenerativeModel {
    val ctx = context()
    val config = generationConfig {
      this.context = ctx
      this.temperature = temperature
      this.topK = 16
      this.maxOutputTokens = maxTokens
    }
    return GenerativeModel(config)
  }

  override fun definition() = ModuleDefinition {
    Name("GeminiNano")

    // True only if AICore + the Nano model can actually run here.
    AsyncFunction("isAvailable") { promise: Promise ->
      scope.launch {
        val ok = try {
          val model = buildModel(0.2f, 32)
          try {
            model.prepareInferenceEngine()
            true
          } finally {
            model.close()
          }
        } catch (e: Throwable) {
          Log.w("GeminiNano", "isAvailable failed: ${e.javaClass.name}: ${e.message}", e)
          false
        }
        promise.resolve(ok)
      }
    }

    AsyncFunction("generate") { prompt: String, temperature: Double, maxTokens: Int, promise: Promise ->
      scope.launch {
        try {
          val model = buildModel(temperature.toFloat(), maxTokens)
          val text = try {
            model.generateContent(prompt).text ?: ""
          } finally {
            model.close()
          }
          promise.resolve(text)
        } catch (e: Throwable) {
          promise.reject("GEMINI_NANO_ERROR", e.message ?: "Gemini Nano generation failed", e)
        }
      }
    }
  }
}
