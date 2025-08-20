import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { SearchResults, GridPostList, AppLoader } from '@/components/shared';
import {
  useGetPosts,
  useSearchPosts,
} from '@/lib/tanstack-query/queriesAndMutations';
import useDebounce from '@/hooks/useDebounce';
import { useInView } from 'react-intersection-observer';

const Explore = () => {
  const { ref, inView } = useInView();
  const [searchValue, setSearchValue] = useState('');
  const debouncedValue = useDebounce(searchValue, 500);
  // console.log(debouncedValue);

  const { data: posts, fetchNextPage, hasNextPage } = useGetPosts();
  const { data: searchedPosts, isFetching: isSearchFetching } =
    useSearchPosts(debouncedValue);

  useEffect(() => {
    if (inView && !searchValue) fetchNextPage();
  }, [inView, searchValue]);

  if (!posts) return <AppLoader />;

  const shouldShowResults = searchValue !== '';
  const shouldShowPosts =
    !shouldShowResults &&
    posts?.pages.every((item) => item.documents.length === 0);

  const allPosts = posts.pages.flatMap((page) => page.documents);

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search Posts</h2>
        <div className="flex gap-1 px-4 w-full rounded-lg bg-dark-4">
          <img
            src="/assets/icons/search.svg"
            alt="search"
            width={24}
            height={24}
          />
          <Input
            type="text"
            placeholder="search"
            className="explore-search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-between w-full max-w-5xl mt-16 mb-7">
        <h3 className="body-bold md:h3-bold">Popular Today</h3>
      </div>

      <div className="flex gap-9 w-full max-w-5xl">
        {shouldShowResults ? (
          <SearchResults
            isSearchFetching={isSearchFetching}
            searchedPosts={searchedPosts || { documents: [] }}
          />
        ) : shouldShowPosts ? (
          <p className="text-light-4 text-center w-full">End of Post</p>
        ) : (
          <GridPostList posts={allPosts} />
        )}
      </div>

      {hasNextPage && !searchValue && (
        <div ref={ref} className="mt-10">
          <AppLoader />
        </div>
      )}
    </div>
  );
};

export default Explore;
