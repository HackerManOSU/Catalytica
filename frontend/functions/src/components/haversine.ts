export function haversineDistance(
    [lat1, lon1]: [number, number],
    [lat2, lon2]: [number, number]
  ): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    //AIzaSyBO-qiuLLo53uyPfNGiBDj0ire87UXS8ns
    const R = 6371; // Radius of Earth in km
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }