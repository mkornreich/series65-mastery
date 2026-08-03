package expo.modules.appintents

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Opens a URL in a *specific* installed app (by package id) via an explicit
// ACTION_VIEW intent — e.g. play a YouTube link in NewPipe instead of the
// default handler. Returns false (so JS can fall back to the system handler)
// when the target app isn't installed or can't handle the link.
//
// Under Android 11+ package visibility, both the install check and the explicit
// launch require the target package to be visible — the app manifest declares a
// <queries> entry for org.schabi.newpipe so this works.
class AppIntentsModule : Module() {

  private fun isInstalled(pkg: String): Boolean {
    val pm = appContext.reactContext?.packageManager ?: return false
    return try {
      pm.getPackageInfo(pkg, 0)
      true
    } catch (_: PackageManager.NameNotFoundException) {
      false
    } catch (_: Throwable) {
      false
    }
  }

  override fun definition() = ModuleDefinition {
    Name("AppIntents")

    // Whether an app with this package id is installed and visible to us.
    Function("isAppInstalled") { pkg: String -> isInstalled(pkg) }

    // Try to open `url` in the app `pkg`. Returns true if an activity launched.
    Function("openInApp") { url: String, pkg: String ->
      val ctx = appContext.reactContext
      if (ctx == null) {
        false
      } else {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
          setPackage(pkg)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        try {
          (appContext.currentActivity ?: ctx).startActivity(intent)
          true
        } catch (_: Throwable) {
          false
        }
      }
    }
  }
}
