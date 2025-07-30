import { useState } from 'react';

const Explore = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button
        onClick={() => {
          setCount((count) => count + 1);
        }}
      >
        add
      </button>
      <p>{count}</p>
    </div>
  );
};

export default Explore;
