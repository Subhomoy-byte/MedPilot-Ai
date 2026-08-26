import { DEMO_FIXTURE_IDS, type DemoFixtureId } from "@/lib/constants";

export function isDemoFixtureId(documentId: string): documentId is DemoFixtureId {
  return (DEMO_FIXTURE_IDS as readonly string[]).includes(documentId);
}
