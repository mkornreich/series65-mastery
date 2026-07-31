const { withAndroidManifest } = require('@expo/config-plugins');

// The AICore (Gemini Nano) AAR declares a high minSdkVersion. Rather than raise
// the whole app's minSdk (which would drop older devices that can still use the
// GGUF/llama path), we tell the manifest merger to allow the lower app minSdk
// and override the library's requirement. Gemini Nano code is guarded at runtime
// by an availability check, so old devices simply never call into it.
const AICORE_LIB = 'com.google.ai.edge.aicore';

module.exports = function withGeminiNano(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    manifest['uses-sdk'] = manifest['uses-sdk'] || [{ $: {} }];
    const usesSdk = manifest['uses-sdk'][0];
    usesSdk.$ = usesSdk.$ || {};

    const existing = usesSdk.$['tools:overrideLibrary'];
    const libs = new Set(
      (existing ? existing.split(',') : []).map((s) => s.trim()).filter(Boolean)
    );
    libs.add(AICORE_LIB);
    usesSdk.$['tools:overrideLibrary'] = Array.from(libs).join(',');

    return cfg;
  });
};
