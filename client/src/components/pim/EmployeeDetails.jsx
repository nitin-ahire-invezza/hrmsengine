import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AdminLeave from "./admin/AdminLeave";
import AdminAttendance from "./admin/AdminAttendance";
import AdminTimeSheet from "./admin/AdminTimeSheet";
import AdminInfo from "./admin/AdminInfo";
import { useLocation, useNavigate } from "react-router-dom";
import ApiendPonits from "../../api/APIEndPoints.json";

const EmployeeDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const defaultTab = location.state?.activeTab || "TimeSheet"; // Default to "TimeSheet" if no state is passed
  const token = localStorage.getItem("accessToken");

  const [checking, setChecking] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  

  const [activeTab, setActiveTab] = useState(defaultTab);
  const { _id } = useParams();

  // Perform a check if _id is in the user's team. If no then navigate to view team. If yes then do nothing

  const handleBackClick = () => {
    const from = location.state?.from || null;
    if(from){
      navigate(from);
    }else{
      navigate("/pim/employeelist");
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "Info":
        return <AdminInfo Id={_id} onBack={handleBackClick}/>;
      case "Leave":
        return <AdminLeave Id={_id} />;
      case "TimeSheet":
        return <AdminTimeSheet Id={_id} />;
      case "Attendance":
        return <AdminAttendance Id={_id} />;
      default:
        return <AdminInfo Id={_id} />;
    }
  };

  useEffect(() => {
    // If _id is missing, treat as error 
    if (!_id) {
      setChecking(false);
      setErrorMessage("No employee selected. Please go back and choose an employee.");
      return;
    }

    const controller = new AbortController();

    const checkMembership = async () => {
      setChecking(true);
      setErrorMessage(null);

      try {
        const res = await fetch(`${ApiendPonits.baseUrl}${ApiendPonits.endpoints.checkmembership}`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ employeeId: _id }),
          signal: controller.signal,
        });

        // If server responds with 2xx -> parse JSON and decide
        if (res.ok) {
          const data = await res.json();
          if (data && data.isMember === true) {
            setIsMember(true); // allowed => show component
          } else {
            // server explicitly says not a member -> redirect to viewteam
            navigate("/pim/viewteam", { replace: true });
          }
        } else {
          // Non-2xx (500, 403, 404 etc) -> show friendly message (no redirect)
          // You can customize message based on status if desired
          let msg =
            res.status === 403
              ? "You are not authorized to view this employee."
              : "Unable to verify access right now. Please try again later.";
          setErrorMessage(msg);
        }
      } catch (err) {
        if (err.name === "AbortError") return; // request aborted on unmount
        console.error("Membership check error:", err);
        setErrorMessage("Network error while verifying access. Please check your connection.");
      } finally {
        setChecking(false);
      }
    };

    checkMembership();

    return () => controller.abort();
  }, [_id, navigate]);


  return (
    <div className="flex flex-col gap-2 h-full ">
      { isMember && (
        <>
          <div className="bg-white dark:bg-neutral-950 p-2 dark:text-white rounded-md sticky top-0 z-20 flex justify-between md:justify-start gap-2 h-fit ">
          <button
            className={`px-3 py-1  ${
              activeTab === "TimeSheet"
                ? "bg-[#5336FD] text-white font-bold  rounded-md"
                : "hover:bg-sky-50 dark:hover:bg-neutral-900 rounded-md"
            }`}
            onClick={() => setActiveTab("TimeSheet")}
          >
            TimeSheet
          </button>

          <button
            className={`px-3 py-1  ${
              activeTab === "Attendance"
                ? "bg-[#5336FD] text-white font-bold  rounded-md"
                : "hover:bg-sky-50 dark:hover:bg-neutral-900 rounded-md"
            }`}
            onClick={() => setActiveTab("Attendance")}
          >
            Attendance
          </button>
          <button
            className={`px-3 py-1  ${
              activeTab === "Leave"
                ? "bg-[#5336FD] text-white font-bold  rounded-md"
                : "hover:bg-sky-50 dark:hover:bg-neutral-900 rounded-md"
            }`}
            onClick={() => setActiveTab("Leave")}
          >
            Leave
          </button>
          <button
            className={`px-3 py-1  ${
              activeTab === "Info"
                ? "bg-[#5336FD] text-white font-bold  rounded-md"
                : "hover:bg-sky-50 dark:hover:bg-neutral-900 rounded-md"
            }`}
            onClick={() => setActiveTab("Info")}
          >
            Details
          </button>
          </div>

          <div
            className={`h-full   ${
              activeTab === "TimeSheet"
                ? "pb-20"
                : activeTab === "Info"
                ? ""
                : activeTab === "Leave"
                ? "mb-20"
                : "pb-32"
            }`}
          >
            {renderContent()}
          </div>
        </>
        )
      }
      {
        checking && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin border-4 border-gray-200 rounded-full w-10 h-10 mx-auto mb-3" />
              <div className="text-sm text-gray-500">Verifying access...</div>
            </div>
          </div>
        )
      }
      {
        errorMessage && (
          <div className="bg-white dark:bg-neutral-950 p-4 dark:text-white rounded-md">
            <div className="text-red-600 mb-3 font-medium">Could not verify access</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">{errorMessage}</div>
          </div>
        )
      }
    </div>
  );
};

export default EmployeeDetails;
