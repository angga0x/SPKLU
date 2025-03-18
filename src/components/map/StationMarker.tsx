
import mapboxgl from 'mapbox-gl';
import { ChargingStation } from '../../utils/api';

interface CreateStationMarkerProps {
  station: ChargingStation;
  map: mapboxgl.Map;
  onStationClick: (station: ChargingStation) => void;
}

export const createStationMarker = ({ station, map, onStationClick }: CreateStationMarkerProps) => {
  const { latitude, longitude } = station.addressInfo;
  
  const markerElement = document.createElement('div');
  markerElement.className = `station-marker flex items-center justify-center relative`;
  markerElement.style.width = '32px';
  markerElement.style.height = '32px';
  
  const bgColor = station.status === 'available' ? 'bg-green-100' : 
                  station.status === 'busy' ? 'bg-yellow-100' : 'bg-red-100';
  
  const iconColor = station.status === 'available' ? 'text-green-500' : 
                    station.status === 'busy' ? 'text-yellow-500' : 'text-red-500';
  
  const bgCircle = document.createElement('div');
  bgCircle.className = `absolute inset-0 m-auto ${bgColor} rounded-full border border-gray-300`;
  markerElement.appendChild(bgCircle);
  
  const icon = document.createElement('div');
  icon.className = 'absolute inset-0 m-auto flex items-center justify-center';
  icon.innerHTML = `<svg class="${iconColor} z-10" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2h10"></path><path d="M9 11V7"></path><path d="M15 11V7"></path><path d="M11 15v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"></path><path d="M5 22v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"></path><path d="M11 1v3"></path><circle cx="11" cy="11" r="2"></circle></svg>`;
  markerElement.appendChild(icon);

  const popup = new mapboxgl.Popup({
    offset: [0, -20],
    closeButton: true,
    closeOnClick: false,
    maxWidth: '300px',
    className: 'custom-popup rounded-lg shadow-lg'
  }).setHTML(`
    <div class="p-3 text-sm">
      <button class="popup-close absolute right-2 top-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      
      <div class="mb-2 pr-6">
        <h3 class="font-bold text-base text-gray-900 dark:text-gray-100">${station.addressInfo.title}</h3>
        <div class="flex items-center mt-1">
          <div class="w-2 h-2 rounded-full ${
            station.status === 'available' ? 'bg-green-500' : 
            station.status === 'busy' ? 'bg-yellow-500' : 'bg-red-500'
          } mr-1.5"></div>
          <span class="text-xs font-medium ${
            station.status === 'available' ? 'text-green-700 dark:text-green-400' : 
            station.status === 'busy' ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'
          } capitalize">${station.status || 'Unknown'}</span>
        </div>
      </div>
      
      <div class="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
        <p class="text-xs text-gray-600 dark:text-gray-300">${station.addressInfo.addressLine1 || ''}</p>
        <p class="text-xs text-gray-600 dark:text-gray-300">
          ${station.addressInfo.town || ''}${station.addressInfo.town && station.addressInfo.stateOrProvince ? ', ' : ''}${station.addressInfo.stateOrProvince || ''}
        </p>
      </div>
      
      ${station.connections && station.connections.length > 0 ? `
        <div class="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
          <p class="text-xs font-medium text-gray-700 dark:text-gray-200 mb-1">Charging Details:</p>
          <div class="flex flex-col gap-1">
            ${station.connections.map(conn => `
              <div class="flex items-center text-xs text-gray-600 dark:text-gray-300">
                <svg class="w-3 h-3 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7 2h10"></path><path d="M9 11V7"></path><path d="M15 11V7"></path>
                  <path d="M11 15v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"></path>
                </svg>
                ${conn.connectionType?.title || 'Unknown'} • ${conn.powerKW ? conn.powerKW + ' kW' : 'Unknown power'}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <p class="text-xs font-medium text-blue-600 dark:text-blue-400">
          ${station.distance ? station.distance.toFixed(1) + ' km away' : 'Distance unknown'}
        </p>
        <p class="text-xs font-medium ${
          station.usageCost === 'Rp0/kWh' || station.usageCost === 'Free' ? 
          'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'
        }">${station.usageCost || 'Price unknown'}</p>
      </div>
      
      <button class="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-md transition-colors" 
        onclick="window.dispatchEvent(new CustomEvent('get-directions', {detail: '${station.id}'}))">
        Dapatkan petunjuk arah
      </button>
    </div>
  `);

  // Use window event listener instead of document for better accessibility
  window.addEventListener('get-directions', (e: Event) => {
    const customEvent = e as CustomEvent;
    const selectedId = customEvent.detail;
    if (selectedId === station.id.toString()) {
      onStationClick(station);
      popup.remove(); // Close popup after clicking directions
    }
  });

  const marker = new mapboxgl.Marker({
    element: markerElement,
    anchor: 'center',
  })
    .setLngLat([station.addressInfo.longitude, station.addressInfo.latitude])
    .setPopup(popup)
    .addTo(map);

  marker.getElement().addEventListener('click', () => {
    console.log("Station clicked:", station.addressInfo.title);
    onStationClick(station);
  });

  return marker;
};
