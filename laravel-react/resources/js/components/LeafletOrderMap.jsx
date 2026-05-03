import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function createMarkerIcon(kind, label) {
    return L.divIcon({
        className: `leaflet-order-marker leaflet-order-marker--${kind}`,
        html: `
            <span class="leaflet-order-marker__dot"></span>
            <span class="leaflet-order-marker__label">${escapeHtml(label)}</span>
        `,
        iconSize: [122, 44],
        iconAnchor: [28, 40],
        popupAnchor: [0, -34],
    });
}

export default function LeafletOrderMap({
    storeLocation,
    customerLocation,
    riderLocation,
    riderLabel,
    riderMarkerLabel,
    destinationLabel,
    storeLabel,
    className = '',
}) {
    const mapElementRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const layerGroupRef = useRef(null);

    useEffect(() => {
        if (!mapElementRef.current || mapInstanceRef.current) {
            return undefined;
        }

        const map = L.map(mapElementRef.current, {
            zoomControl: false,
            scrollWheelZoom: false,
            attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        mapInstanceRef.current = map;
        layerGroupRef.current = L.layerGroup().addTo(map);

        return () => {
            layerGroupRef.current?.clearLayers();
            map.remove();
            layerGroupRef.current = null;
            mapInstanceRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!mapInstanceRef.current || !layerGroupRef.current || !storeLocation || !customerLocation) {
            return;
        }

        const map = mapInstanceRef.current;
        const layerGroup = layerGroupRef.current;
        layerGroup.clearLayers();

        const mapPoints = [storeLocation, customerLocation];
        const routePoints = [storeLocation];

        if (riderLocation) {
            mapPoints.push(riderLocation);
            routePoints.push(riderLocation);
        }

        routePoints.push(customerLocation);

        L.polyline(
            routePoints.map((point) => [point.lat, point.lng]),
            {
                color: '#cf4f77',
                weight: 5,
                opacity: 0.92,
            },
        ).addTo(layerGroup);

        L.circleMarker([storeLocation.lat, storeLocation.lng], {
            radius: 8,
            color: '#241913',
            fillColor: '#241913',
            fillOpacity: 1,
            weight: 2,
        }).addTo(layerGroup);

        L.marker([storeLocation.lat, storeLocation.lng], {
            icon: createMarkerIcon('store', 'Store'),
        })
            .addTo(layerGroup)
            .bindPopup(escapeHtml(storeLabel));

        if (riderLocation) {
            L.circleMarker([riderLocation.lat, riderLocation.lng], {
                radius: 8,
                color: '#1f6a54',
                fillColor: '#1f6a54',
                fillOpacity: 1,
                weight: 2,
            }).addTo(layerGroup);

            L.marker([riderLocation.lat, riderLocation.lng], {
                icon: createMarkerIcon('rider', riderMarkerLabel || 'Rider'),
            })
                .addTo(layerGroup)
                .bindPopup(escapeHtml(riderLabel));
        }

        L.circleMarker([customerLocation.lat, customerLocation.lng], {
            radius: 8,
            color: '#c26a2f',
            fillColor: '#c26a2f',
            fillOpacity: 1,
            weight: 2,
        }).addTo(layerGroup);

        L.marker([customerLocation.lat, customerLocation.lng], {
            icon: createMarkerIcon('customer', 'Customer'),
        })
            .addTo(layerGroup)
            .bindPopup(escapeHtml(destinationLabel));

        const bounds = L.latLngBounds(mapPoints.map((point) => [point.lat, point.lng]));
        map.fitBounds(bounds.pad(0.26), {
            animate: false,
            maxZoom: 16,
        });
    }, [customerLocation, destinationLabel, riderLabel, riderLocation, riderMarkerLabel, storeLabel, storeLocation]);

    return <div className={`leaflet-order-map ${className}`.trim()} ref={mapElementRef} />;
}
