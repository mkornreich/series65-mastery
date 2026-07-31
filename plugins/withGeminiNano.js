const { withAndroidManifest } = require('@expo/config-plugins');

// The ML Kit GenAI (Gemini Nano) AARs declare a higher minSdkVersion (26) than
// the app (24). Rather than raise the whole app's minSdk (which would drop older
// devices that can still use the GGUF/llama path), we tell the manifest merger to
// allow the lower app minSdk and override the libraries' requirement. Gemini Nano
// code is guarded at runtime by an availability check, so old devices never call
// into it.
const GENAI_LIBS = ['com.google.mlkit.genai.prompt', 'com.google.mlkit.genai.common'];

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
    GENAI_LIBS.forEach((lib) => libs.add(lib));
    usesSdk.$['tools:overrideLibrary'] = Array.from(libs).join(',');

    return cfg;
  });
};
