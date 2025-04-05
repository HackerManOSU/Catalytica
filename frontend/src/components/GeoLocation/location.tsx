import Cookies from 'js-cookie';

export function requestAndStoreLocation() {
  if (!navigator.geolocation) {
    console.error("Geolocation not supported :(");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      Cookies.set("userLocation", JSON.stringify({ lat: latitude, lng: longitude }), { expires: 7 });
      console.log("Location stored:", latitude, longitude);
    },
    (error) => {
      console.error("Location permission denied or failed:", error.message);
    }
  );
}

