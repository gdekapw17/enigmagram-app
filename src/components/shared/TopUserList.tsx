import { Link } from 'react-router-dom';

const TopUserList = ({ user }: { user: any }) => {
  return (
    <Link to={`/profile/${user.$id}`} className="user-card">
      <div className="bg-dark-2 rounded-xl p-4 sm:p-6 flex-center flex-col gap-3 sm:gap-4 border border-dark-4 hover:bg-dark-3 transition-colors w-full min-h-[200px] sm:min-h-[220px] hover:scale-105 hover:shadow-lg">
        {/* User Avatar - Responsive sizes */}
        <img
          src={user.imageUrl || '/assets/icons/profile-placeholder.svg'}
          alt={`${user.name}'s profile`}
          className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-primary-500"
        />

        {/* User Info */}
        <div className="flex-center flex-col gap-1 w-full">
          <p className="text-sm sm:text-base font-semibold text-light-1 text-center line-clamp-1 w-full">
            {user.name}
          </p>
          {user.username && (
            <p className="text-xs sm:text-sm text-light-3 text-center line-clamp-1 w-full">
              @{user.username}
            </p>
          )}
        </div>

        {/* User Stats - Responsive layout */}
        {(user.postsCount !== undefined || user.likesCount !== undefined) && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-light-3 w-full">
            {user.postsCount !== undefined && (
              <div className="flex items-center gap-1">
                <img
                  src="/assets/icons/posts.svg"
                  alt="posts"
                  className="w-3 h-3 sm:w-4 sm:h-4"
                />
                <p className="text-xs sm:text-sm font-medium">
                  {user.postsCount} posts
                </p>
              </div>
            )}
            {user.likesCount !== undefined && (
              <div className="flex items-center gap-1">
                <img
                  src="/assets/icons/like.svg"
                  alt="likes"
                  className="w-3 h-3 sm:w-4 sm:h-4"
                />
                <p className="text-xs sm:text-sm font-medium">
                  {user.likesCount} likes
                </p>
              </div>
            )}
          </div>
        )}

        {/* Follow Button - Responsive */}
        <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 sm:px-6 lg:px-8 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto">
          Follow
        </button>
      </div>
    </Link>
  );
};

export default TopUserList;
