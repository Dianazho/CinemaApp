import { useState, useEffect, useRef } from "react";
import { useLocalStorageState } from "./useLocalStorage";
import { useKey } from "./useKey";
// const KEY = "86a9866b";

export default function App() {
  const [query, setQuery] = useState("");
  const [moviesRes, setMoviesRes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [watchListMov, setWatchlistMov] = useLocalStorageState([], "watched");

  function handleCloseMovieDetails() {
    setSelectedId(null);
  }

  function handleSelectMovie(movieID) {
    setSelectedId((selectedId) => (movieID === selectedId ? null : movieID));
  }

  function handleAddWatchListMovie(movie) {
    setWatchlistMov((watchList) => [...watchList, movie]);
  }

  function handleDeleteWatchListMov(movieID) {
    setWatchlistMov(watchListMov.filter((movie) => movie.imdbID !== movieID));
  }

  useKey("Escape", handleCloseMovieDetails);
  useEffect(
    function () {
      localStorage.setItem("watched", JSON.stringify(watchListMov));
    },
    [watchListMov]
  );

  useEffect(
    function () {
      const controller = new AbortController();

      async function fetchMovies() {
        try {
          setIsLoading(true);
          setError("");
          const res = await fetch(
            `https://www.omdbapi.com/?apikey=86a9866b&s=${query}`,
            { signal: controller.signal }
          );

          if (!res.ok)
            throw new Error("Something went wrong with fetching movies");

          const data = await res.json();
          console.log(data);
          if (data.Response === "False") throw new Error("Movie not found");

          setMoviesRes(data.Search);
          setError("");
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error(err.message);
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      }
      if (query.length < 3) {
        setMoviesRes([]);
        return;
      }

      fetchMovies();
      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <>
      <Navbar query={query} onSetQuery={setQuery} moviesRes={moviesRes} />
      <Body>
        <LeftCol
          isLoading={isLoading}
          error={error}
          moviesRes={moviesRes}
          onSelectMovie={handleSelectMovie}
        />
        <RightCol
          selectedId={selectedId}
          watchListMov={watchListMov}
          onCloseMovieDetails={handleCloseMovieDetails}
          onHandleAddWatchListMovie={handleAddWatchListMovie}
          onHandleDeleteWatchListMov={handleDeleteWatchListMov}
        />
      </Body>
    </>
  );
}

function ErrorMessage({ message }) {
  return <p className="cta"> {message}</p>;
}
// ************************************
// Nav Bar
// ************************************
function Navbar({ query, onSetQuery, moviesRes }) {
  const inputEl = useRef(null);

  useKey("Enter", function () {
    if (document.activeElement === inputEl.current) return;
    inputEl.current.focus();
    onSetQuery("");
  });

  // useEffect(
  //   function () {
  //     function callback(e) {
  //       if (document.activeElement === inputEl.current) return;

  //       if (e.code === "Enter") {
  //         inputEl.current.focus();
  //         setQuery("");
  //       }
  //     }

  //     document.addEventListener("keydown", callback);
  //     return () => document.addEventListener("keydown", callback);
  //   },
  //   [setQuery]
  // );

  return (
    <nav>
      <p>Movie Search</p>
      <input
        ref={inputEl}
        className="search-item"
        type="text"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => onSetQuery(e.target.value)}
      />
      <span className="movies-found-counter">
        Found {moviesRes.length} results
      </span>
    </nav>
  );
}

function LeftCol({ isLoading, error, moviesRes, onSelectMovie }) {
  return (
    <div className="left-col">
      {/* Left Column */}
      {isLoading && <Loader />}

      {!isLoading && !error && moviesRes.length < 1 && (
        <div className="cta">Let's find something to watch</div>
      )}

      {!isLoading && !error && moviesRes.length > 0 && (
        <ul className="movie-list">
          {moviesRes.map((movie) => (
            <li
              className="movie-item"
              key={movie.imdbID}
              onClick={() => onSelectMovie(movie.imdbID)}
            >
              <img
                className="movie-poster"
                alt={movie.Title}
                src={movie.Poster}
              />
              <div className="movie-info-div">
                <p className="movie-title">{movie.Title}</p>
                <span>{movie.Year}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <ErrorMessage message={error} />}
    </div>
  );
}

function RightCol({
  children,
  selectedId,
  watchListMov,
  onHandleDeleteWatchListMov,
  onHandleAddWatchListMovie,
  onSetMoviesRes,
  onSelectedId,
  onCloseMovieDetails,
}) {
  const [isOpen, setIsOpen] = useState(true);

  function handleOpenCloseWatchListList() {
    setIsOpen(!isOpen);
  }

  return (
    <>
      {!selectedId && (
        <div className="movie-list">
          {/* Watchlist Header */}
          <div className="watched-header">
            <h3>Your watchlist</h3>
            <p>Save movies & shows to watch later</p>
            <span>
              🎞 {watchListMov.length}{" "}
              {watchListMov.length === 1 ? "Movie" : "Movies"} on your list
            </span>
            {watchListMov.length > 0 && (
              <button
                className="button button-right"
                onClick={handleOpenCloseWatchListList}
              >
                {isOpen ? "–" : "+"}
              </button>
            )}
          </div>
          {/* Watched List */}
          {isOpen && (
            <ul className="watched-list">
              {watchListMov.map((movie) => (
                <li className="movie-item space-between" key={movie.imdbID}>
                  <div className="watched-movie-div">
                    <img
                      className="movie-poster-watched"
                      alt={movie.title}
                      src={movie.poster}
                    />
                    <div className="movie-info-div space-between">
                      <div className="gap">
                        <p className="movie-title">{movie.title}</p>
                        <span>{movie.year}</span>
                      </div>
                      <div className="movie-details">
                        <span>
                          <span role="img" aria-label="time">
                            ⌛️
                          </span>{" "}
                          {movie.runtime}
                        </span>
                        <span>
                          <span role="img" aria-label="star">
                            ⭐️
                          </span>{" "}
                          {movie.imdbRating} imdb
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="button-delete"
                    onClick={() => onHandleDeleteWatchListMov(movie.imdbID)}
                  >
                    X
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {/* Open Movie Details (right column) */}
      {selectedId && (
        <MovieDetails
          watchListMov={watchListMov}
          onHandleAddWatchListMovie={onHandleAddWatchListMovie}
          onSetMoviesRes={onSetMoviesRes}
          selectedId={selectedId}
          onSelectedId={onSelectedId}
          onCloseMovieDetails={onCloseMovieDetails}
        />
      )}
    </>
  );
}

function Body({ children }) {
  return <main>{children}</main>;
}

function Loader() {
  return <div className="loading">Loading...</div>;
}

function MovieDetails({
  watchListMov,
  onHandleAddWatchListMovie,
  selectedId,
  onSelectedId,
  onCloseMovieDetails,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [movie, setMovie] = useState({});

  const {
    Title: title,
    Year: year,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Actors: actors,
    Director: director,
    Genre: genre,
    Country: country,
    Language: language,
  } = movie;

  const isAddedToWatched = watchListMov
    .map((movie) => movie.imdbID)
    .includes(selectedId);

  useEffect(
    function () {
      if (!title) return;
      document.title = `Movie | ${title}`;

      return function () {
        document.title = "CinemaApp";
        // console.log(`Clean up effect for movie ${title}`);
      };
    },
    [title]
  );

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      runtime,
      imdbRating: Number(imdbRating),
    };
    onHandleAddWatchListMovie(newWatchedMovie);
    onCloseMovieDetails();
  }

  useEffect(
    function () {
      async function getMovieDetails() {
        setIsLoading(true);
        const res = await fetch(
          `https://www.omdbapi.com/?apikey=86a9866b&i=${selectedId}`
        );
        const data = await res.json();
        setMovie(data);
        console.log(data);
        setIsLoading(false);
      }
      getMovieDetails();
    },
    [selectedId]
  );

  return (
    <div>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="movie-details-div">
          <button className="button" onClick={onCloseMovieDetails}>
            ←
          </button>
          <div className="movie-main-info-div">
            <img src={poster} alt={title} />
            <div className="movie-details-info">
              <h2>{title}</h2>
              <h3>
                {year} • {runtime}
              </h3>
              <h4 className="genre">{genre}</h4>
              <h3>
                <span>
                  <span role="img" aria-label="star">
                    ⭐️
                  </span>
                </span>{" "}
                {imdbRating} MDB rating
              </h3>
              <div>
                {!isAddedToWatched ? (
                  <button className="button-add" onClick={handleAdd}>
                    Add to watchlist
                  </button>
                ) : (
                  <p className="added-to-watch">Added to watch later</p>
                )}
              </div>
            </div>
          </div>
          <div className="movie-details-additional">
            <p className="plot">{plot}</p>
            <p>Actors: {actors}</p>
            <p>Director: {director}</p>
            <p>Country: {country}</p>
            <p>Language: {language}</p>
          </div>
        </div>
      )}
    </div>
  );
}
