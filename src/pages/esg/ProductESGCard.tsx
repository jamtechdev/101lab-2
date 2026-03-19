import React from "react";
import { DollarSign, Trash2, CloudSnow, Scale } from "lucide-react";

const categoryCarbonFactors = {
    "Material Handling Equipment": 10,
    "Construction & Earthmoving Equipment": 20,
    "Agricultural Equipment": 15,
    "Shop & Maintenance Tools": 8,
    "Test & Measurement Equipment": 12,
    "Industrial Equipment, Parts & Systems": 18,
    "Printing Equipment": 10,
    "IT & Data Center Equipment": 12,
    "Food Processing Equipment": 14,
    "Plastics Processing Equipment": 16,
    "Automotive & Transportation Equipment": 18,
    "Pharmaceutical & Lab Equipment": 12,
    "Energy, Power & Utilities": 20,
    "Surplus & Scrap Materials": 5,
    "Packaging Equipment": 10,
    "Automation & Robotics": 15,
    "Semiconductor & Electronics Manufacturing": 20,
    "Others": 8,
    "Recycling Technology": 12,
    "Metalworking Equipment": 15,
    "Woodworking Equipment": 8,
    "Transport & Logistics Equipment": 18,
    "France 4545": 10,
    "Industrial Equipment": 18,
    "machinery": 15,
    "test 2": 8,
    "精密磨床": 15,
};

const conditionMultipliers = {
    "new": 1.0,
    "used – functional": 0.8,
    "for parts": 0.5,
    "waste disposal": 0.2,
    "demolition & removal": 0.1,
};

const ProductESGCard = ({ product }) => {
    const quantity = Number(product.meta.find(m => m.meta_key === "quantity")?.meta_value || 1);
    const conditionKey = product.meta.find(m => m.meta_key === "condition")?.meta_value?.toLowerCase() || "new";
    const categoryName = product.categories[0]?.term || "Others";

    const replacementCost = Number(product.meta.find(m => m.meta_key === "replacement_cost")?.meta_value || 1000);
    const weight = Number(product.meta.find(m => m.meta_key === "weight")?.meta_value || 10);

    const categoryFactor = categoryCarbonFactors[categoryName] || 8;
    const conditionMultiplier = conditionMultipliers[conditionKey] || 0.8;

    const totalReplacementCostSaved = quantity * replacementCost;
    const totalWasteDiverted = quantity * weight;
    const totalEmbodiedCarbonAvoided = quantity * weight * categoryFactor * conditionMultiplier;

    return (
        <div className="w-full bg-white rounded-xl shadow-md  space-y-2">
            {/* <h2 className="text-lg font-semibold text-neutral-900">ESG Impact</h2> */}
            {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> */}
            <div>
                {false &&
                    <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center justify-center">
                        <DollarSign className="text-green-600 mb-2" />
                        <p className="text-sm text-green-700">Replacement Cost Saved</p>
                        <p className="text-lg font-bold text-green-900">${totalReplacementCostSaved.toLocaleString()}</p>
                    </div>
                }
                {false &&
                    <div className="bg-yellow-50 rounded-lg p-4 flex flex-col items-center justify-center">
                        <Scale className="text-yellow-600 mb-2" /> {/* Better icon for weight */}
                        <p className="text-sm text-yellow-700">Weight Diverted</p>
                        <p className="text-lg font-bold text-yellow-900">{totalWasteDiverted} kg</p>
                    </div>
                }
                <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center justify-center">
                    <CloudSnow className="text-green-600 mb-2" />
                    <p className="text-sm text-green-700">Carbon Avoided</p>
                    <p className="text-lg font-bold text-green-900">{totalEmbodiedCarbonAvoided.toLocaleString()} kg CO₂e</p>
                </div>
            </div>
        </div>
    );
};

export default ProductESGCard;
