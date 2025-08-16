import type { Models } from 'appwrite';
import { Link } from 'react-router-dom';

type TopUserListProps = {
  user: any;
};

const TopUserList = ({ user }: TopUserListProps) => {
  return (
    <Link to={`/profile/${user.$id}`} className="user-card">
      <div className="bg-dark-2 rounded-xl p-6 flex-center flex-col gap-4 border border-dark-4 hover:bg-dark-3 transition-colors min-w-[190px]">
        {/* User Avatar */}
        <img
          src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
          alt={`${user.name}'s profile`}
          className="w-14 h-14 rounded-full object-cover"
        />

        {/* User Info */}
        <div className="flex-center flex-col gap-1">
          <p className="base-medium text-light-1 text-center line-clamp-1">
            {user.name}
          </p>
          {user.username && (
            <p className="small-regular text-light-3 text-center line-clamp-1">
              @{user.username}
            </p>
          )}
        </div>

        {/* User Stats (if available from TopUsers) */}
        {(user.postsCount !== undefined || user.likesCount !== undefined) && (
          <div className="flex-center gap-2 text-light-3">
            {user.postsCount !== undefined && (
              <div className="flex-center gap-1">
                <img
                  src="/assets/icons/posts.svg"
                  alt="posts"
                  width={16}
                  height={16}
                />
                <p className="tiny-medium">{user.postsCount}</p>
              </div>
            )}
            {user.likesCount !== undefined && (
              <div className="flex-center gap-1">
                <img
                  src="/assets/icons/like.svg"
                  alt="likes"
                  width={16}
                  height={16}
                />
                <p className="tiny-medium">{user.likesCount}</p>
              </div>
            )}
          </div>
        )}

        {/* Follow Button (Optional) */}
        <button className="shad-button_primary px-8 py-2">Follow</button>
      </div>
    </Link>
  );
};

export default TopUserList;
