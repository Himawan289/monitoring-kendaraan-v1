export const THEME_KEY = "theme";

/** Dijalankan sebelum render pertama agar tidak berkedip. */
export const THEME_INIT = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
