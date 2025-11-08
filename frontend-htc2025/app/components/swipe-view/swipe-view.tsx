export default function SwipeView() {
  return (
    <div className="max-w max-h-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden pb-10">

  <img
    src="placeholder.jpg"
    alt="Event Image"
    className="w-full h-56 object-cover"
  />

  <div className="p-6">
    <span className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
      Environment
    </span>

    <h2 className="mt-3 text-2xl font-semibold text-gray-900">
      Event 1
    </h2>
    <p className="text-gray-600 mt-1">Event 1</p>

    <p className="mt-3 text-gray-700">
      Join us for a morning beach cleanup to protect marine life and keep our shores beautiful.
    </p>

    <div className="mt-4 flex items-center text-gray-500 text-sm space-x-4">
      <div className="flex items-center space-x-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-width="2" d="M12 2C8.134 2 5 5.134 5 9c0 7 7 13 7 13s7-6 7-13c0-3.866-3.134-7-7-7z" />
        </svg>
        <span>Santa Monica Beach, CA</span>
      </div>

      <div className="flex items-center space-x-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
        </svg>
        <span>Nov 12, 2025</span>
      </div>

      <div className="flex items-center space-x-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>3 hours</span>
      </div>
    </div>
  </div>
</div>
  );
}