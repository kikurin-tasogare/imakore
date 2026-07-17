import type { Metadata } from "next";
import { ImakoreApp } from "./ImakoreApp";

export const metadata: Metadata = {
  title: "imakore",
  description: "今、頭にあることをそのまま残す、軽い思考整理アプリ。",
};

export default function Home() {
  return <ImakoreApp />;
}
