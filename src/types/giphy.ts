export interface GiphyImageFormat {
  url?: string;
  width?: string | number;
  height?: string | number;
  size?: string | number;
  mp4?: string;
  mp4_size?: string;
  webp?: string;
  webp_size?: string;
}

export interface GiphyUser {
  avatar_url: string;
  banner_url?: string; // Made optional
  profile_url?: string; // Made optional
  username: string;
  display_name: string;
}

export interface GiphyResult {
  type: string;
  id: string;
  url?: string;
  slug: string;
  bitly_gif_url: string;
  bitly_url: string;
  embed_url: string;
  username: string;
  source: string;
  title: string;
  rating: string;
  content_url: string;
  source_tld: string;
  source_post_url: string;
  is_sticker: boolean;
  import_datetime: string;
  trending_datetime: string;
  created?: string; // Added for compatibility
  images: {
    original: GiphyImageFormat;
    downsized?: GiphyImageFormat;
    downsized_large?: GiphyImageFormat;
    downsized_medium?: GiphyImageFormat;
    downsized_small?: GiphyImageFormat;
    downsized_still?: GiphyImageFormat;
    fixed_height?: GiphyImageFormat;
    fixed_height_downsampled?: GiphyImageFormat;
    fixed_height_small?: GiphyImageFormat;
    fixed_height_small_still?: GiphyImageFormat;
    fixed_height_still?: GiphyImageFormat;
    fixed_width?: GiphyImageFormat;
    fixed_width_downsampled?: GiphyImageFormat;
    fixed_width_small?: GiphyImageFormat;
    fixed_width_small_still?: GiphyImageFormat;
    fixed_width_still?: GiphyImageFormat;
    looping?: GiphyImageFormat;
    original_still?: GiphyImageFormat;
    original_mp4?: GiphyImageFormat;
    preview?: GiphyImageFormat;
    preview_gif?: GiphyImageFormat;
    preview_webp?: GiphyImageFormat;
  };
  user?: GiphyUser;
}
