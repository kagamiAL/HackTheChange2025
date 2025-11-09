import * as React from 'react';
import cover from '../../../assets/mountains.jpeg';
import { useOpportunities } from '@/app/context/OpportunityContext';

export default function SwipeView() {
  const { opportunities, selectedOpportunity, setSelectedOpportunity } = useOpportunities();

  const opportunity = selectedOpportunity || opportunities[0];

  if (!opportunity) return <p>No opportunity data yet.</p>;

  return (
  <div className="max-w max-h-md mx-auto bg-white rounded-xl shadow-lg min-h-[60vh] max-h-[90vh]">
    <img
      src={opportunity.organization.logo || cover.src}
      alt="Event Image"
      className="w-full h-56 object-cover"
    />
    <div className="p-6">
      <span className="bg-gray-200 text-gray-900 text-sm font-medium px-3 py-1 rounded-full">
        {opportunity.organization.name}
      </span>

      <h2 className="mt-3 text-2xl font-semibold text-gray-900">
        {opportunity.title}
      </h2>
      <div className='overflow-y-auto max-h-64'>
        <p className="mt-3 text-gray-700">
          {opportunity.description}
        </p>

      <div className="mt-4 flex flex-col text-gray-500 text-sm space-x-4">
        <div className="flex items-center space-x-1 mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeWidth="2" d="M12 2C8.134 2 5 5.134 5 9c0 7 7 13 7 13s7-6 7-13c0-3.866-3.134-7-7-7z" />
          </svg>
          <span></span>
        </div>

        <div className="flex items-center space-x-1 mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2v-7H3v7a2 2 0 002 2z" />
          </svg>
          <span>Nov 12, 2025</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button
          className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-red-200 text-red-500
                transform transition duration-200 ease-in-out hover:scale-110 active:scale-95 hover:bg-red-200 focus:outline-none cursor-pointer"
          aria-label="skip"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          className="inline-flex items-center justify-center w-14 h-14 rounded-full
                text-white shadow-md border-2 border-blue-300 
                transform transition duration-200 ease-in-out hover:scale-110 active:scale-95 focus:outline-none cursor-pointer hover:bg-blue-300"
          aria-label="save">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="blue" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
        </button>
      </div>
        <p className="text-gray-500 text-sm">
          Swipe left to skip • Swipe right to save
        </p>
      </div>
    </div>
  </div>
  );
}