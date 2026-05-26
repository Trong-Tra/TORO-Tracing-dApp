// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title TORO Types
/// @notice Shared data structures for the TORO tuna supply chain tracer.
library ToroTypes {

    enum Stage {
        Hatchery,
        Nursery,
        Growout,
        HarvestTransport,
        FarmProcessing,
        CatchIce,
        PortLanding,
        TransportPlant,
        CatchProcessing,
        FinalProduct
    }

    struct Hatchery {
        bytes32 batchId;
        uint256 eggWeightKg;
        string hatcheryLocation;
        uint256 spawnDate;
        bytes32 supplierProfileHash;
    }

    struct Nursery {
        bytes32 batchId;
        bytes32 prevTxHash;
        uint256 fryWeightKg;
        uint256 survivalRatePct;
        string pondId;
        bytes32 feedTypeHash;
    }

    struct Growout {
        bytes32 batchId;
        bytes32 prevTxHash;
        uint256 fishWeightKg;
        uint256 densityPerM3;
        uint256 harvestDate;
        bytes32 antibioticFreeCertHash;
    }

    struct HarvestTransport {
        bytes32 batchId;
        bytes32 prevTxHash;
        uint256 shippedWeightKg;
        int8 iceTempC;
        string truckId;
        uint256 arrivalTime;
    }

    struct FarmProcessing {
        bytes32 batchId;
        bytes32 prevTxHash;
        uint256 inputWeightKg;
        uint256 outputCans;
        uint256 wastageKg;
        bytes32 supervisorId;
    }

    struct CatchIce {
        bytes32 batchId;
        uint256 catchWeightKg;
        bytes32 catchLocationLatlonHash;
        string fishingMethod;
        string vesselId;
        uint256 catchDate;
    }

    struct PortLanding {
        bytes32 batchId;
        bytes32 prevTxHash;
        uint256 landedWeightKg;
        string portName;
        int8 coldStorageTemp;
        bytes32 qualityCertHash;
    }

    struct TransportPlant {
        bytes32 batchId;
        bytes32 prevTxHash;
        uint256 shippedWeightKg;
        string containerId;
        uint256 transitTimeHours;
        bytes32 storageConditionHash;
    }

    struct CatchProcessing {
        bytes32 batchId;
        bytes32 prevTxHash;
        uint256 inputWeightKg;
        uint256 outputCans;
        uint256 wastageKg;
        bytes32 supervisorId;
    }

    struct FinalProduct {
        bytes32 batchId;
        bytes32 prevTxHashA; // farm chain
        bytes32 prevTxHashB; // catch chain
        uint256 totalCans;
        uint256 farmCans;
        uint256 catchCans;
        string batchLabel;
        uint256 packagingDate;
        string distributionCenter;
    }
}
