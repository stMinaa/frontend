/**
 * Building Selection Component
 * Handles building and apartment selection for tenant signup
 */

import React, { useEffect, useState } from 'react';
import { buildingAPI } from '../services/api';

function BuildingSelection({ onBuildingSelect, onApartmentSelect }) {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [vacantUnits, setVacantUnits] = useState([]);
  const [selectedApartment, setSelectedApartment] = useState('');
  const [loadingBuildings, setLoadingBuildings] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState('');

  // Fetch buildings on mount
  useEffect(() => {
    fetchBuildings();
  }, []);

  // Fetch vacant apartments when building selected
  useEffect(() => {
    if (selectedBuilding) {
      fetchVacantUnits(selectedBuilding);
    } else {
      setVacantUnits([]);
      setSelectedApartment('');
      onApartmentSelect('');
    }
  }, [selectedBuilding]);

  const fetchBuildings = async () => {
    setLoadingBuildings(true);
    setError('');
    try {
      const data = await buildingAPI.getPublicBuildings();
      setBuildings(data);
    } catch (err) {
      setError('Failed to load buildings');
    } finally {
      setLoadingBuildings(false);
    }
  };

  const fetchVacantUnits = async (buildingId) => {
    setLoadingUnits(true);
    setError('');
    try {
      const data = await buildingAPI.getVacantApartments(buildingId);
      setVacantUnits(data);
    } catch (err) {
      setError('Failed to load apartments');
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleBuildingChange = (buildingId) => {
    setSelectedBuilding(buildingId);
    setSelectedApartment('');
    onBuildingSelect(buildingId);
    onApartmentSelect('');
  };

  const handleApartmentChange = (apartmentId) => {
    setSelectedApartment(apartmentId);
    onApartmentSelect(apartmentId);
  };

  const getBuildingLabel = (building) => {
    const name = building.name?.trim();
    return name ? `${name} – ${building.address}` : building.address;
  };

  return (
    <div className="building-selection">
      <div className="form-group">
        <label htmlFor="building-select">Building (Claim)</label>
        <select
          id="building-select"
          value={selectedBuilding}
          onChange={(e) => handleBuildingChange(e.target.value)}
          required
          disabled={loadingBuildings}
        >
          <option value="">Select building</option>
          {buildings.map((building) => (
            <option key={building._id} value={building._id}>
              {getBuildingLabel(building)}
            </option>
          ))}
        </select>
        {loadingBuildings && <small className="form-hint">Loading buildings...</small>}
        {!loadingBuildings && buildings.length === 0 && (
          <small className="form-hint">No buildings available</small>
        )}
      </div>

      {selectedBuilding && (
        <div className="form-group">
          <label htmlFor="apartment-select">Apartment (Vacant)</label>
          <select
            id="apartment-select"
            value={selectedApartment}
            onChange={(e) => handleApartmentChange(e.target.value)}
            required
            disabled={loadingUnits}
          >
            <option value="">Select apartment</option>
            {vacantUnits.map((unit) => (
              <option key={unit._id} value={unit._id}>
                {unit.unitNumber}
              </option>
            ))}
          </select>
          <small className="form-hint">
            Manager will verify before approval
          </small>
          {loadingUnits && <small className="form-hint">Loading apartments...</small>}
          {!loadingUnits && vacantUnits.length === 0 && (
            <small className="form-hint">No vacant apartments in this building</small>
          )}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default BuildingSelection;
