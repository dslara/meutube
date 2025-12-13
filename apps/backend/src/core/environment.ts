import dotenv from "dotenv";
dotenv.config();

export const { 
  TMDB_API_URL = '',
  TMDB_ACCESS_TOKEN = '',
} = process.env;
