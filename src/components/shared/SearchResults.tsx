import type { Models } from 'appwrite';
import AppLoader from './AppLoader';
import GridPostList from './GridPostList';

type SearchResultsProps = {
  isSearchFetching: boolean;
  searchedPosts: { documents: Models.Document[] } | null;
};

const SearchResults = ({
  isSearchFetching,
  searchedPosts,
}: SearchResultsProps) => {
  if (isSearchFetching) return <AppLoader />;

  if (searchedPosts && searchedPosts.documents.length > 0)
    return <GridPostList posts={searchedPosts.documents} />;

  return (
    <p className="text-light-4 mt-10 text-center w-full">No Results Found</p>
  );
};

export default SearchResults;
