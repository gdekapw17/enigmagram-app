import { useGetTopUsers } from '@/lib/tanstack-query/queriesAndMutations';
import type { Models } from 'appwrite';

const AllUsers = () => {
  const { data } = useGetTopUsers();
  console.log(data);

  return (
    <div>
      {data?.documents.map((user: Models.Document, index) => (
        <p key={index}>{user.name}</p>
      ))}
    </div>
  );
};

export default AllUsers;
