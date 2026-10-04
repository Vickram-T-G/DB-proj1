import Lottie from "lottie-react";
import loadingLottie from "../assets/loading-lottie.json";

const LoadingSpinner = ({ className = "" }) => {
  return (
    <div
      className={`flex items-center justify-center w-full`}
      style={{
        minHeight: 220,
        minWidth: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Lottie
        animationData={loadingLottie}
        loop
        autoplay
        style={{
          width: 200,
          height: 200,
          minWidth: 200,
          minHeight: 200,
          maxWidth: 240,
          maxHeight: 240,
          margin: "0 auto",
          display: "block",
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
