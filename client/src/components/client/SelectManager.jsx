// SelectManager.jsx
import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import userprofile from "../../assets/images/clientAvatar.png";

const SelectManager = ({ options = [], projectForm, setProjectForm }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedId = projectForm?.managerId || "";

  const toggleDropdown = () => setIsOpen((v) => !v);

  const handleSelect = (id) => {
    setProjectForm((prev) => ({ ...prev, managerId: id }));
    setIsOpen(false);
  };

  // close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const selectedEmployee = options.find((emp) => String(emp._id) === String(selectedId));

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Dropdown button - matches MultiSelectDropdown style */}
      <div
        className="flex items-center justify-between rounded-md p-2 cursor-pointer bg-white dark:bg-neutral-800"
        onClick={toggleDropdown}
        role="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex flex-wrap gap-2">
          {selectedEmployee ? (
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-neutral-700 px-2 py-1 rounded-md">
              <img
                src={selectedEmployee.profileUrl || userprofile}
                alt={selectedEmployee.name}
                className="w-5 h-5 rounded-full"
              />
              <span className="text-xs">{selectedEmployee.name.split(" ")[0]}</span>
            </div>
          ) : (
            <span className="text-gray-400">Select Manager *</span>
          )}
        </div>
        <FaChevronDown className={`transition ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {/* Dropdown menu - same look as MultiSelectDropdown */}
      {isOpen && (
        <div
          className="absolute left-0 w-full mt-2 p-2 flex flex-col gap-1 bg-white dark:bg-neutral-800 rounded-md shadow-lg z-50 max-h-52 overflow-y-scroll scrollbrhdn"
          role="listbox"
        >
          {options.map((employee) => (
            <div
              key={employee._id}
              className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-md ${
                String(selectedId) === String(employee._id)
                  ? "bg-blue-200 dark:bg-neutral-700"
                  : ""
              }`}
              onClick={() => handleSelect(employee._id)}
              role="option"
              aria-selected={String(selectedId) === String(employee._id)}
            >
              <img
                src={employee.profileUrl || userprofile}
                alt={employee.name}
                className="w-6 h-6 rounded-md"
              />
              <span className="text-sm">{employee.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SelectManager;
