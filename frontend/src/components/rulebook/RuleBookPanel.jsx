import { useMemo, useState } from "react";
import { RULE_BOOK_DATA } from "./ruleBookData.js";

export default function RuleBookPanel({ rules = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");

  const selectedCategoryData = useMemo(
    () =>
      RULE_BOOK_DATA.find(
        (item) => item.category === selectedCategory
      ),
    [selectedCategory]
  );

  const products = selectedCategoryData?.products || [];

  const selectedProductData = products.find(
    (product) => product.name === selectedProduct
  );

  const applicableRules = (selectedProductData?.rules || [])
    .map((code) => rules.find((rule) => rule.code === code))
    .filter(Boolean);

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setSelectedProduct("");
  };

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Regulatory Reference
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-slate-900">
          Product Rule Book
        </h2>

        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Select a commodity category and product to view the applicable
          Legal Metrology compliance requirements.
        </p>
      </div>

      {/* Selectors */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Category */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            1. Select Category
          </label>

          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-slate-500"
          >
            <option value="">Select a category...</option>

            {RULE_BOOK_DATA.map((item) => (
              <option key={item.category} value={item.category}>
                {item.category}
              </option>
            ))}
          </select>
        </div>

        {/* Product */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            2. Select Product
          </label>

          <select
            value={selectedProduct}
            onChange={(event) => setSelectedProduct(event.target.value)}
            disabled={!selectedCategory}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 focus:border-slate-500"
          >
            <option value="">
              {selectedCategory
                ? "Select a product..."
                : "Select a category first"}
            </option>

            {products.map((product) => (
              <option key={product.name} value={product.name}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Empty state */}
      {!selectedProduct && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            Select a category and product to view its rules.
          </p>

          <p className="mt-1 text-xs text-slate-500">
            The rules shown will be based on the selected commodity.
          </p>
        </div>
      )}

      {/* Applicable rules */}
      {selectedProduct && (
        <div className="mt-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Applicable Requirements
              </p>

              <h3 className="mt-1 text-xl font-semibold text-slate-900">
                {selectedProduct}
              </h3>

              <p className="text-sm text-slate-500">
                Category: {selectedCategory}
              </p>
            </div>

            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
              {applicableRules.length} Rules
            </span>
          </div>

          {applicableRules.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Rule Code
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Requirement
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Severity
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Version
                    </th>

                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Effective From
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {applicableRules.map((rule) => (
                    <tr
                      key={rule.code}
                      className="border-t border-slate-200"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800">
                        {rule.code}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {rule.name}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            rule.severity === "HIGH"
                              ? "bg-red-50 text-red-700"
                              : rule.severity === "MEDIUM"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {rule.severity}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {rule.version}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {rule.effective}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No applicable rules are currently mapped to this product.
            </div>
          )}

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Compliance Reference
            </p>

            <p className="mt-1 text-sm text-slate-600">
              These rules are used as references for the Legal-Lens
              compliance checking workflow. Final applicability should be
              verified against the relevant official notification or
              regulation.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}