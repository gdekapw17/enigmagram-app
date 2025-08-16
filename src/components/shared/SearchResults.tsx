import type { Models } from 'appwrite';
import AppLoader from './AppLoader';
import GridPostList from './GridPostList';
import TopUserList from './TopUserList';

type SearchResultsProps = {
  isSearchFetching: boolean;
  searchedPosts?: { documents: Models.Document[] } | null;
  searchedUsers?: { documents: Models.Document[] } | null;
};

const SearchResults = ({
  isSearchFetching,
  searchedPosts = { documents: [] },
  searchedUsers = { documents: [] },
}: SearchResultsProps) => {
  if (isSearchFetching) return <AppLoader />;

  if (searchedPosts && searchedPosts.documents.length > 0)
    return <GridPostList posts={searchedPosts.documents} />;

  if (searchedUsers && searchedUsers.documents.length > 0)
    return <TopUserList user={searchedUsers.documents} />;

  return (
    <p className="text-light-4 mt-10 text-center w-full">No Results Found</p>
  );
};

export default SearchResults;
