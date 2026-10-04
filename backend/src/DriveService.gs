/**
 * DriveService.gs
 * Upload screenshot trade ke Google Drive (folder khusus), kembalikan URL
 * yang bisa dipakai langsung di tag <img>.
 */

var ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
var MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function getOrCreateScreenshotFolder_() {
  var it = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function extensionForMime_(mimeType) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'jpg';
}

/**
 * Terima data gambar (data URL atau base64 murni), simpan ke Drive,
 * dan kembalikan { id, url, viewUrl }.
 */
function uploadImage_(input) {
  input = input || {};
  var data = safeString_(input.data);
  if (!data) throw new Error('Data gambar kosong.');

  var comma = data.indexOf(',');
  if (data.indexOf('data:') === 0 && comma >= 0) {
    data = data.slice(comma + 1);
  }

  var mimeType = safeString_(input.mimeType) || 'image/jpeg';
  if (ALLOWED_IMAGE_MIME.indexOf(mimeType) === -1) {
    throw new Error('Tipe gambar tidak didukung: ' + mimeType);
  }

  var bytes = Utilities.base64Decode(data);
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw new Error(
      'Ukuran gambar melebihi batas ' +
        Math.round(MAX_IMAGE_BYTES / 1024 / 1024) +
        'MB.'
    );
  }

  var fileName = safeString_(input.fileName);
  if (!fileName) {
    fileName = 'screenshot-' + new Date().getTime() + '.' + extensionForMime_(mimeType);
  }

  var folder = getOrCreateScreenshotFolder_();
  var file = folder.createFile(Utilities.newBlob(bytes, mimeType, fileName));

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // Domain bisa melarang sharing publik; URL tetap dikembalikan.
  }

  var id = file.getId();
  return {
    id: id,
    url: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1600',
    viewUrl: file.getUrl()
  };
}
