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

export interface TmdbRequestOptions {
	language?: string; 
	api_key?: string;
	[key: string]: any;
}

export default {};
