import mapboxgl from 'mapbox-gl';
import { ChargingStation } from '../../utils/api';

interface CreateStationClusterProps {
  cluster: {
    latitude: number;
    longitude: number;
    count: number;
    stations: ChargingStation[];
  };
  map: mapboxgl.Map;
  onClusterClick: (cluster: { stations: ChargingStation[]; latitude: number; longitude: number }) => void;
}

export const createStationCluster = ({ cluster, map, onClusterClick }: CreateStationClusterProps) => {
  const { latitude, longitude, count, stations } = cluster;
  
  // Create element for the cluster marker
  const clusterElement = document.createElement('div');
  clusterElement.className = `station-cluster flex items-center justify-center relative`;
  clusterElement.style.width = '40px';
  clusterElement.style.height = '40px';
  
  // Create the outer circle
  const outerCircle = document.createElement('div');
  outerCircle.className = `absolute inset-0 m-auto bg-blue-100 rounded-full border border-blue-300 flex items-center justify-center shadow-md`;
  clusterElement.appendChild(outerCircle);
  
  // Create the inner text
  const countText = document.createElement('div');
  countText.className = 'text-blue-700 font-bold text-sm';
  countText.textContent = String(count);
  outerCircle.appendChild(countText);
  
  // Generate a unique id for this marker to avoid duplicate event handlers
  const markerId = `cluster-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  clusterElement.setAttribute('data-cluster-id', markerId);
  
  // Create popup with summary
  const createPopupHTML = () => {
    // Group stations by status
    const availableCount = stations.filter(s => s.status === 'available').length;
    const busyCount = stations.filter(s => s.status === 'busy').length;
    const offlineCount = stations.filter(s => s.status === 'offline').length;
    
    // Get the highest power available
    let highestPower = 0;
    stations.forEach(station => {
      station.connections.forEach(conn => {
        if (conn.powerKW && conn.powerKW > highestPower) {
          highestPower = conn.powerKW;
        }
      });
    });
    
    return `
      <div class="p-3 text-sm">
        <h3 class="font-bold text-base mb-2">${count} Stasiun Pengisian di Area Ini</h3>
        
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="flex items-center">
            <div class="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
            <span class="text-xs">${availableCount} Tersedia</span>
          </div>
          <div class="flex items-center">
            <div class="w-2 h-2 rounded-full bg-yellow-500 mr-1.5"></div>
            <span class="text-xs">${busyCount} Sibuk</span>
          </div>
          <div class="flex items-center">
            <div class="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div>
            <span class="text-xs">${offlineCount} Offline</span>
          </div>
          <div class="flex items-center">
            <svg class="w-3 h-3 mr-1.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 2h10"></path><path d="M9 11V7"></path><path d="M15 11V7"></path>
            </svg>
            <span class="text-xs">Hingga ${highestPower} kW</span>
          </div>
        </div>
        
        <button class="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 rounded-md transition-colors">
          Lihat stasiun di area ini
        </button>
      </div>
    `;
  };
  
  const popup = new mapboxgl.Popup({
    offset: [0, -15],
    closeButton: true,
    closeOnClick: false,
    maxWidth: '260px',
    className: 'custom-popup rounded-lg shadow-lg'
  }).setHTML(createPopupHTML());
  
  // Create the marker
  const marker = new mapboxgl.Marker({
    element: clusterElement,
    anchor: 'center',
  })
    .setLngLat([longitude, latitude])
    .setPopup(popup)
    .addTo(map);
  
  // Handle click on cluster
  clusterElement.addEventListener('click', () => {
    // If we're at max zoom, show the popup
    if (map.getZoom() >= 14) {
      marker.togglePopup();
    } else {
      // Otherwise, zoom to the cluster area
      map.flyTo({
        center: [longitude, latitude],
        zoom: Math.min(map.getZoom() + 2, 15),
        speed: 1.2
      });
    }
    
    // Call the callback
    onClusterClick(cluster);
  });
  
  // Add event listener for the button in popup
  popup.on('open', () => {
    setTimeout(() => {
      const expandButton = document.querySelector('.custom-popup button') as HTMLButtonElement;
      if (expandButton) {
        expandButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          onClusterClick(cluster);
          popup.remove();
        });
      }
    }, 100);
  });
  
  return marker;
};
