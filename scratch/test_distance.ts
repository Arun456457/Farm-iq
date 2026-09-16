import { calculateAutomatedDistance, calculateAccurateRoadDistanceAsync } from '../src/utils/distance';

async function run() {
  console.log('--- TEST 1: Ongole to Ongole (sync) ---');
  const res1 = calculateAutomatedDistance('Ongole', 'Ongole');
  console.log('Sync result:', {
    distanceKm: res1.distanceKm,
    deliveryTariff: res1.deliveryTariff,
    method: res1.calculationMethod,
    origin: res1.originLabel,
    dest: res1.destinationLabel
  });

  console.log('\n--- TEST 2: Ongole to Ongole (async) ---');
  const res2 = await calculateAccurateRoadDistanceAsync('Ongole, Andhra Pradesh', 'Santhapet, Ongole');
  console.log('Async result:', {
    distanceKm: res2.distanceKm,
    deliveryTariff: res2.deliveryTariff,
    method: res2.calculationMethod,
    duration: res2.durationText
  });

  console.log('\n--- TEST 3: Ongole to Guntur (async) ---');
  const res3 = await calculateAccurateRoadDistanceAsync('Ongole', 'Guntur');
  console.log('Ongole -> Guntur result:', {
    distanceKm: res3.distanceKm,
    deliveryTariff: res3.deliveryTariff,
    method: res3.calculationMethod,
    duration: res3.durationText
  });
}

run().catch(console.error);
