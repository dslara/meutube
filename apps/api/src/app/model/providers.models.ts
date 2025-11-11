export interface IPirateBayResult {
  id: string;
  name: string;
  info_hash: string;
  leechers: string;
  seeders: string;
  num_files: string;
  size: string;
  username: string;
  added: string;
  status: string;
  category: string;
  imdb: string;
}

const Categories = {
  AUDIO: '100',
  VIDEO: '200',
  APPLICATIONS: '300',
  GAMES: '400',
  OTHER: '600'
} as const;

// Subcategorias comuns
const VideoSubcategories = {
  MOVIES: '201',
  MOVIES_DVDR: '202',
  MUSIC_VIDEOS: '203',
  MOVIE_CLIPS: '204',
  TV_SHOWS: '205',
  HANDHELD: '206',
  HD_MOVIES: '207',
  HD_TV_SHOWS: '208',
  MOVIES_3D: '209'
} as const;
