import { useEffect, useRef, useState } from "react";

export function useMovies(query) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const KEY = "cf630d58";
  useEffect(
    function () {
      const controller = new AbortController();
      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");

          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&S=${query}`,
            { signal: controller.signal }
          );

          // Failed API Search
          if (!res.ok)
            throw new Error("Something went wrong with fetching movies!");

          const data = await res.json();

          // Failed to find a movie
          if (data.Response === "False") throw new Error("Movie not found :(");

          setMovies(data.Search);
          setError("");
          setIsLoading(false);
        } catch (err) {
          if (err.name !== "AbortError") setError(err.message);
        } finally {
          setIsLoading(false);
        }
      }

      // Dont search if search query is less than 3 letters
      if (query.length < 3) {
        setMovies([]);
        setError("");
        return;
      }
      //   handleDetailsClose();
      fetchMovies();
    },
    [query]
  );
  return { movies, isLoading, error };
}
