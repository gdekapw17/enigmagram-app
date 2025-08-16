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

  if (searchedUsers && searchedUsers.documents.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {searchedUsers.documents.map((user) => (
          <TopUserList user={user as any} key={user.$id} />
        ))}
      </div>
    );
  }

  return (
    <p className="text-light-4 mt-10 text-center w-full">No Results Found</p>
  );
};

export default SearchResults;
