import { useState } from 'react';
import {
  useGetTopUsers,
  useSearchUsers,
} from '@/lib/tanstack-query/queriesAndMutations';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/useDebounce';
import { AppLoader, SearchResults, TopUserList } from '@/components/shared';

const AllUsers = () => {
  const [searchValue, setSearchValue] = useState('');
  const debouncedValue = useDebounce(searchValue, 500);

  const { data: topUsers } = useGetTopUsers();
  // console.log(topUsers);
  const { data: searchedUsers, isPending: isUserFetching } =
    useSearchUsers(debouncedValue);

  if (!topUsers) return <AppLoader />;

  const shouldShowResults = searchValue !== '';
  const shouldShowUsers =
    !shouldShowResults && topUsers?.documents && topUsers.documents.length > 0;

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

      <div className="w-full max-w-5xl mt-16 mb-7 px-4 sm:px-6 lg:px-0">
        <h3 className="body-bold md:h3-bold mb-7">Popular User</h3>
        {shouldShowResults ? (
          <SearchResults
            isSearchFetching={isUserFetching}
            searchedUsers={searchedUsers || { documents: [] }}
          />
        ) : (
          shouldShowUsers && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {topUsers?.documents.map((user) => (
                <TopUserList user={user as any} key={user.$id} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AllUsers;
