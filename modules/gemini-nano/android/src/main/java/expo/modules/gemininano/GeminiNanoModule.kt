package expo.modules.gemininano

import android.util.Log
import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.common.FeatureStatus
import com.google.mlkit.genai.prompt.GenerateContentRequest
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.TextPart
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

// Exposes Google's on-device Gemini Nano through the ML Kit GenAI Prompt API
// (com.google.mlkit:genai-prompt). This is the current, non-deprecated path
// (the AI Edge `aicore` SDK is deprecated). ML Kit auto-initializes its context,
// so no explicit Android Context is needed to obtain a client.
class GeminiNanoModule : Module() {
  private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

  override fun definition() = ModuleDefinition {
    Name("GeminiNano")

    // True if Gemini Nano can be used here (ready now, or downloadable).
    AsyncFunction("isAvailable") { promise: Promise ->
      scope.launch {
        val ok = try {
          val model = Generation.getClient()
          try {
            val status = model.checkStatus()
            status == FeatureStatus.AVAILABLE ||
              status == FeatureStatus.DOWNLOADABLE ||
              status == FeatureStatus.DOWNLOADING
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
          val model = Generation.getClient()
          try {
            val status = model.checkStatus()
            if (status == FeatureStatus.UNAVAILABLE) {
              throw IllegalStateException("Gemini Nano is not supported on this device.")
            }
            // Download the on-device model feature if it isn't ready yet.
            if (status != FeatureStatus.AVAILABLE) {
              model.download().collect { ds ->
                if (ds is DownloadStatus.DownloadFailed) {
                  val ex = ds.e
                  throw IllegalStateException(
                    "Gemini Nano download failed (code ${ex.errorCode}): ${ex.message}",
                    ex
                  )
                }
              }
            }
            val temp = temperature.toFloat()
            val request = GenerateContentRequest.Builder(TextPart(prompt)).apply {
              this.temperature = temp
              this.maxOutputTokens = maxTokens
            }.build()
            val response = model.generateContent(request)
            val text = response.candidates.firstOrNull()?.text ?: ""
            promise.resolve(text)
          } finally {
            model.close()
          }
        } catch (e: Throwable) {
          Log.w("GeminiNano", "generate failed: ${e.javaClass.name}: ${e.message}", e)
          promise.reject("GEMINI_NANO_ERROR", e.message ?: "Gemini Nano generation failed", e)
        }
      }
    }
  }
}
