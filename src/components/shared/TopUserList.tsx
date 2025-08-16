import type { Models } from 'appwrite';

type GridUserListProps = {
  user: Models.Document[];
};

const GridUserList = ({ user }: GridUserListProps) => {
  return <div className="bg-dark-2 rounded-lg flex-center"></div>;
};

export default GridUserList;
