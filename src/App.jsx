import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";
import "./index2.css";
import "./responsive.css";
import { useMovies } from "./useMovies";
import { useLocalStorageState } from "./useLocalStorageState";
import { useKey } from "./useKey";

const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const KEY = "cf630d58";

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { movies, isLoading, error } = useMovies(query);
  const [watched, setWatched] = useLocalStorageState([], "watched");
  const [rewatch, setRewatch] = useState(false);

  function handleDetailsOpen(id) {
    setSelectedId((selectedId) => (selectedId === id ? null : id));
  }

  function handleDetailsClose() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => [...watched, movie]);
  }

  function handleRewatch(watchedMovies) {
    setWatched(watchedMovies);
    setRewatch((r) => !r);
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((w) => w.imdbID !== id));
  }

  return (
    <>
      <NavBar>
        <SearchBar query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && (
            <MoviesList
              movies={movies}
              onDetailsOpen={handleDetailsOpen}
              onDetailsClose={handleDetailsClose}
            />
          )}
          {error && <ErrorMessage message={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              handleDetailsClose={handleDetailsClose}
              onAddWatched={handleAddWatched}
              watched={watched}
              setRewatch={setRewatch}
            />
          ) : (
            <>
              <Sumarry watched={watched} />
              <WatchedMovieList
                watched={watched}
                onDeleteWatched={handleDeleteWatched}
                onDetailsOpen={handleDetailsOpen}
              />
            </>
          )}
        </Box>
        {rewatch && (
          <ModalWindow
            onClose={setRewatch}
            watched={watched}
            onRewatch={handleRewatch}
            selectedId={selectedId}
          />
        )}
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ message }) {
  return (
    <p className="error">
      <span>❌</span>
      {message}
    </p>
  );
}

function NavBar({ children }) {
  return (
    <nav className="nav-bar">
      <Logo />
      {children}
    </nav>
  );
}

function SearchBar({ query, setQuery }) {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    setQuery("");
  });

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function Logo() {
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function Main({ children }) {
  return <main className="main">{children}</main>;
}

function Box({ children }) {
  const [isOpen1, setIsOpen1] = useState(true);
  return (
    <div className={`box ${!isOpen1 ? "box--closed" : ""}`}>
      <button
        className="btn-toggle"
        onClick={() => setIsOpen1((open) => !open)}
      >
        {isOpen1 ? "–" : "+"}
      </button>
      {isOpen1 && children}
    </div>
  );
}

// function WatchedBox() {
//   const [watched, setWatched] = useState(tempWatchedData);
//   const [isOpen2, setIsOpen2] = useState(true);

//   return (
//     <div className="box">
//       <button
//         className="btn-toggle"
//         onClick={() => setIsOpen2((open) => !open)}
//       >
//         {isOpen2 ? "–" : "+"}
//       </button>
//       {isOpen2 && (
//         <>
//           <Sumarry watched={watched} />
//           <WatchedMovieList watched={watched} />
//         </>
//       )}
//     </div>
//   );
// }

function Sumarry({ watched }) {
  const avgImdbRating = average(
    watched.map((movie) => movie.imdbRating)
  ).toFixed(2);
  const avgUserRating = average(
    watched.map((movie) => movie.userRating)
  ).toFixed(2);
  const avgRuntime = average(watched.map((movie) => movie.runtime)).toFixed(0);
  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function MovieDetails({
  selectedId,
  handleDetailsClose,
  onAddWatched,
  watched,
  setRewatch,
}) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState("");

  const isWatched = watched.map((w) => w.imdbID).includes(selectedId);

  const userWatchedRating = watched.find(
    (movie) => movie.imdbID === selectedId
  )?.userRating;

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = movie;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
      rewatchCount: 0,
      rewatchComment: [],
    };

    onAddWatched(newWatchedMovie);
    handleDetailsClose();
  }

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
        );
        const data = await res.json();
        setMovie(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedId]
  );

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = "usePopcorn";
      };
    },
    [title]
  );

  useKey("Enter", handleDetailsClose);

  return (
    // <div className="details">
    //   <button className="btn-back" onClick={handleDetailsClose}>
    //     &larr;
    //   </button>
    //   {selectedId}
    // </div>

    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={handleDetailsClose}>
              &larr;
            </button>
            <img src={poster} alt={`Poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{title}</h2>
              <p>
                {released} &bull; {runtime}
              </p>
              <p>{genre}</p>
              <p>
                <span>⭐️</span>
                {imdbRating} IMDb rating
              </p>
            </div>
          </header>
          <section>
            <div className="rating">
              {!isWatched ? (
                <>
                  <StarRating
                    maxRating={10}
                    size={24}
                    onSetRating={setUserRating}
                  />
                  {userRating > 0 && (
                    <button className="btn-add" onClick={handleAdd}>
                      + Add to List
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p>You rated this movie with {userWatchedRating} ⭐</p>
                  <p>
                    Rewatch Status:{" "}
                    {watched.find((mov) => mov.imdbID === selectedId)
                      .rewatchCount + " "}
                    time
                  </p>
                  <button
                    className="btn-add"
                    onClick={() => setRewatch((r) => !r)}
                  >
                    Rewatch
                  </button>
                </>
              )}
            </div>

            {watched.find((mov) => mov.imdbID === selectedId)?.rewatchComment
              .length > 0 && <h3>Comments</h3>}

            {watched
              .find((mov) => mov.imdbID === selectedId)
              ?.rewatchComment.map((mov, i) => (
                <Comment number={i} comment={mov} />
              ))}

            <p>
              <em>{plot}</em>
            </p>
            <p>Starring {actors}</p>
            <p>Directed by {director}</p>
          </section>
        </>
      )}
    </div>
  );
}

function MoviesList({ movies, onDetailsOpen, onDetailsClose }) {
  return (
    <ul className="list list-movies">
      {movies?.map((movie) => (
        <Movie
          movie={movie}
          key={movie.imdbID}
          onDetailsOpen={onDetailsOpen}
          onDetailsClose={onDetailsClose}
        />
      ))}
    </ul>
  );
}

function WatchedMovieList({ watched, onDeleteWatched, onDetailsOpen }) {
  return (
    <ul className="list list-movies">
      {watched.map((movie) => (
        <WatchedMovie
          movie={movie}
          key={movie.imdbID}
          onDeleteWatched={onDeleteWatched}
          onDetailsOpen={onDetailsOpen}
        />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched, onDetailsOpen }) {
  return (
    <li onClick={() => onDetailsOpen(movie.imdbID)}>
      <img src={movie.poster} alt={`${movie.title} poster`} />
      <h3>{movie.title}</h3>
      <button
        className="btn-delete"
        onClick={() => onDeleteWatched(movie.imdbID)}
      >
        X
      </button>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <p>
          <span>🔂</span>
          <span>{movie.rewatchCount} time</span>
        </p>
      </div>
    </li>
  );
}

function Movie({ movie, onDetailsOpen }) {
  return (
    <li onClick={() => onDetailsOpen(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓️</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function ModalWindow({ onClose, watched, onRewatch, selectedId }) {
  const [comment, setComment] = useState("");
  function handleClose() {
    onClose((r) => !r);
  }

  function handleRewatch() {
    const newWatched = watched.map((mov) =>
      mov.imdbID === selectedId
        ? {
            ...mov,
            rewatchCount: mov.rewatchCount + 1,
            rewatchComment: [...mov.rewatchComment, comment],
          }
        : mov
    );

    // console.log(comment);
    onRewatch(newWatched);
    // console.log(newWatched);
  }

  return (
    <div className="overlay">
      <div className="modal ">
        <button className="close-modal" onClick={handleClose}>
          &times;
        </button>
        <h1>What are your thoughts about the movie on this rewatch?</h1>
        {/* <input
        type="text"
        className="model-input"
        placeholder="Your thoughts..."
      /> */}
        <textarea
          name=""
          id=""
          cols="30"
          rows="10"
          className="model-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></textarea>
        <button className="btn-add" onClick={handleRewatch}>
          Submit
        </button>
      </div>
    </div>
  );
}

function Comment({ number, comment }) {
  return (
    <p>
      Rewatch {number + 1}: {comment}
    </p>
  );
}
