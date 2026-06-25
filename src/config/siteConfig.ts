export const siteConfig = {
  title: import.meta.env.VITE_GAME_TITLE || "Chart Empire",
  siteUrl: import.meta.env.VITE_SITE_URL || window.location.origin,
  xingRecordsUrl: import.meta.env.VITE_XING_RECORDS_URL || "https://www.xingrecords.com",
  indieMusicPromotionUrl: import.meta.env.VITE_INDIE_MUSIC_PROMOTION_URL || "https://www.indiemusicpromotion.com",
  song: {
    youtubeId: import.meta.env.VITE_SONG_OF_WEEK_YOUTUBE_ID || "",
    title: import.meta.env.VITE_SONG_OF_WEEK_TITLE || "Song of the Week",
    artist: import.meta.env.VITE_SONG_OF_WEEK_ARTIST || "Xing Records",
    url: import.meta.env.VITE_SONG_OF_WEEK_URL || "https://www.xingrecords.com"
  }
};
