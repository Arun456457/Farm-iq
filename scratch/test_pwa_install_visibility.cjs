const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING PWA INSTALLATION UI HIDING LOGIC ===');

// Check Navbar.tsx
const navbarSrc = fs.readFileSync(path.join(__dirname, '../src/components/Navbar.tsx'), 'utf-8');

const hasHeaderGuard = navbarSrc.includes('!isAppInstalled && onOpenInstallModal && (\n              <button\n                id="btn-install-app-header"') ||
                       navbarSrc.includes('!isAppInstalled && onOpenInstallModal &&');
console.log('✓ Navbar header button guarded by !isAppInstalled:', hasHeaderGuard);

const hasMenuGuard = navbarSrc.includes('!isAppInstalled && onOpenInstallModal && (\n                        <button\n                          id="menu-item-install-app"') ||
                     navbarSrc.includes('!isAppInstalled && onOpenInstallModal &&');
console.log('✓ Navbar mobile 3-line menu item guarded by !isAppInstalled:', hasMenuGuard);

// Check App.tsx
const appSrc = fs.readFileSync(path.join(__dirname, '../src/App.tsx'), 'utf-8');
const hasAppInstalledState = appSrc.includes('localStorage.getItem(\'farmiq_app_installed\') === \'true\'');
console.log('✓ App.tsx initializes isAppInstalled from localStorage / standalone:', hasAppInstalledState);

const hasNavbarProp = appSrc.includes('isAppInstalled={isAppInstalled}') &&
                      appSrc.includes('onOpenInstallModal={isAppInstalled ? undefined : () => setIsInstallModalOpen(true)}');
console.log('✓ App.tsx passes isAppInstalled and disables modal opener when installed:', hasNavbarProp);

const hasModalGuard = appSrc.includes('{!isAppInstalled && (\n        <InstallAppModal');
console.log('✓ App.tsx completely suppresses InstallAppModal when isAppInstalled is true:', hasModalGuard);

// Check InstallAppModal.tsx
const modalSrc = fs.readFileSync(path.join(__dirname, '../src/components/InstallAppModal.tsx'), 'utf-8');
const hasStorageSave = modalSrc.includes("localStorage.setItem('farmiq_app_installed', 'true')");
console.log('✓ InstallAppModal saves farmiq_app_installed to localStorage on install:', hasStorageSave);

if (!hasHeaderGuard || !hasMenuGuard || !hasAppInstalledState || !hasNavbarProp || !hasModalGuard || !hasStorageSave) {
  console.error('\n❌ PWA Hiding Verification Failed!');
  process.exit(1);
}

console.log('\n🎉 ALL PWA INSTALLATION HIDING CHECKS PASSED!');
