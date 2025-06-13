const fs = require('fs');
const path = 'node_modules/@react-native/gradle-plugin/settings-plugin/src/main/kotlin/com/facebook/react/ReactSettingsExtension.kt';

if (fs.existsSync(path)) {
  let content = fs.readFileSync(path, 'utf8');

  // Comment out all problematic lines
  content = content
    .replace(/layout/g, '// layout')
    .replace(/outputFile/g, '// outputFile')
    .replace(/(= \{\s*[^}]*\})/g, '= {}'); // avoid invalid lambda

  fs.writeFileSync(path, content, 'utf8');
  console.log('✅ Patched ReactSettingsExtension.kt successfully.');
} else {
  console.warn('⚠️ ReactSettingsExtension.kt not found.');
}
