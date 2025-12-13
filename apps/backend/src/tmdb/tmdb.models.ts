export interface Genre {
	id: number;
	name: string;
}

export interface GenresResponse {
	genres: Genre[];
}

export interface Movie {
	id: number;
	title: string;
	original_title?: string;
	overview?: string | null;
	release_date?: string | null; // YYYY-MM-DD
	poster_path?: string | null;
	backdrop_path?: string | null;
	vote_average?: number;
	vote_count?: number;
	popularity?: number;
	adult?: boolean;
	genre_ids?: number[];
}

export interface PagedResponse<T> {
	page: number;
	results: T[];
	total_pages: number;
	total_results: number;
}

export type DiscoverMoviesResponse = PagedResponse<Movie>;

export interface MovieDetails {
	id: number;
	title: string;
	original_title?: string;
	overview?: string | null;
	runtime?: number | null;
	release_date?: string | null;
	genres?: Genre[];
	poster_path?: string | null;
	backdrop_path?: string | null;
	vote_average?: number;
	vote_count?: number;
	popularity?: number;
	status?: string;
	homepage?: string | null;
}

export interface DiscoverMovieQueryParams {
	page?: number;
	language?: string;
	sort_by?: 'popularity.asc' | 'popularity.desc' | 'release_date.asc' | 'release_date.desc' | 'revenue.asc' | 'revenue.desc' | 'primary_release_date.asc' | 'primary_release_date.desc' | 'original_title.asc' | 'original_title.desc' | 'vote_average.asc' | 'vote_average.desc' | 'vote_count.asc' | 'vote_count.desc';
	include_adult?: boolean;
	include_video?: boolean;
	year?: number;
	primary_release_year?: number;
	vote_count_gte?: number;
	vote_count_lte?: number;
	vote_average_gte?: number;
	vote_average_lte?: number;
	with_genres?: string; // comma-separated genre IDs
	with_cast?: string; // comma-separated cast IDs
	with_crew?: string; // comma-separated crew IDs
	with_people?: string; // comma-separated people IDs
	with_companies?: string; // comma-separated company IDs
	with_keywords?: string; // comma-separated keyword IDs
	with_runtime_gte?: number; // minimum runtime in minutes
	with_runtime_lte?: number; // maximum runtime in minutes
	release_date_gte?: string; // YYYY-MM-DD
	release_date_lte?: string; // YYYY-MM-DD
	primary_release_date_gte?: string; // YYYY-MM-DD
	primary_release_date_lte?: string; // YYYY-MM-DD
	region?: string; // ISO 3166-1 code
	watch_region?: string; // ISO 3166-1 code
	with_watch_providers?: string; // comma-separated provider IDs
	without_watch_providers?: string; // comma-separated provider IDs
	with_original_language?: string; // ISO 639-1 language code
	certification_country?: string;
	certification?: string;
	certification_gte?: string;
	certification_lte?: string;
	without_genres?: string; // comma-separated genre IDs
	without_keywords?: string; // comma-separated keyword IDs
	with_release_type?: number; // 1-5 (theatrical, DVD, etc.)
}

export interface TmdbRequestOptions {
	language?: string;
	api_key?: string;
	[key: string]: any;
}

