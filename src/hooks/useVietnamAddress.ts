import { useState, useEffect } from "react";

interface AddressUnit {
  code: number;
  name: string;
}

const BASE_URL = "https://provinces.open-api.vn/api";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

export function useProvinces() {
  const [provinces, setProvinces] = useState<AddressUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<AddressUnit[]>(`${BASE_URL}/?depth=1`)
      .then(setProvinces)
      .catch(() => setProvinces([]))
      .finally(() => setLoading(false));
  }, []);

  return { provinces, loading };
}

export function useDistricts(provinceCode: number | null) {
  const [districts, setDistricts] = useState<AddressUnit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!provinceCode) {
      setDistricts([]);
      return;
    }
    setLoading(true);
    fetchJson<{ districts: AddressUnit[] }>(`${BASE_URL}/p/${provinceCode}?depth=2`)
      .then((data) => setDistricts(data.districts || []))
      .catch(() => setDistricts([]))
      .finally(() => setLoading(false));
  }, [provinceCode]);

  return { districts, loading };
}

export function useWards(districtCode: number | null) {
  const [wards, setWards] = useState<AddressUnit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!districtCode) {
      setWards([]);
      return;
    }
    setLoading(true);
    fetchJson<{ wards: AddressUnit[] }>(`${BASE_URL}/d/${districtCode}?depth=2`)
      .then((data) => setWards(data.wards || []))
      .catch(() => setWards([]))
      .finally(() => setLoading(false));
  }, [districtCode]);

  return { wards, loading };
}
