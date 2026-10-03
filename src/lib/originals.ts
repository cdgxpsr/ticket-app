import { Directory, File, Paths } from 'expo-file-system';

export type OriginalPhoto = { id: string; uri: string };

function albumDir() {
  const dir = new Directory(Paths.document, 'originals');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** 원본 사진을 손대지 않고 앱 문서 폴더에 복사해 보관한다. */
export function saveOriginal(sourceUri: string): OriginalPhoto {
  const src = new File(sourceUri);
  const ext = (src.extension || '.jpg').toLowerCase();
  const id = `${Date.now()}`;
  const dest = new File(albumDir(), `${id}${ext}`);
  src.copy(dest);
  return { id, uri: dest.uri };
}

export function listOriginals(): OriginalPhoto[] {
  try {
    return albumDir()
      .list()
      .filter((f): f is File => f instanceof File)
      .map((f) => ({ id: f.name.replace(/\.[^.]+$/, ''), uri: f.uri }))
      .sort((a, b) => Number(b.id) - Number(a.id));
  } catch {
    return [];
  }
}
