import { useState } from 'react';
import {
  useGetTopUsers,
  useSearchUsers,
} from '@/lib/tanstack-query/queriesAndMutations';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/useDebounce';
import { AppLoader, SearchResults, GridUserList } from '@/components/shared';

const AllUsers = () => {
  const [searchValue, setSearchValue] = useState('');
  const debouncedValue = useDebounce(searchValue, 500);

  const { data: topUsers } = useGetTopUsers();
  const { data: searchedUsers, isPending: isSearchFetching } =
    useSearchUsers(debouncedValue);

  console.log(searchedUsers);

  if (!topUsers) return <AppLoader />;

  const shouldShowResults = searchValue !== '';
  const shouldShowUsers =
    !shouldShowResults &&
    searchedUsers?.documents &&
    searchedUsers.documents.length > 0;

  return (
    <div className="explore-container">
      <div className="explore-inner_container">
        <h2 className="h3-bold md:h2-bold w-full">Search User</h2>
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

      <div className="flex gap-9 w-full max-w-5xl">
        {shouldShowResults ? (
          <SearchResults
            isSearchFetching={isSearchFetching}
            searchedUsers={searchedUsers || { documents: [] }}
          />
        ) : shouldShowUsers ? (
          <p className="text-light-4 text-center w-full">End of Post</p>
        ) : (
          <GridUserList />
        )}
      </div>
    </div>
  );
};

export default AllUsers;
