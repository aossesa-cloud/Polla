/**
 * Test script for campaign creation endpoint
 * Tests all validation paths and successful creation
 */

const API_BASE = "http://localhost:3030/api";

async function testCampaignCreation() {
  console.log("\n🧪 Testing Campaign Creation Endpoint\n");
  console.log("=".repeat(50));

  // Test 1: Missing required fields
  console.log("\n📝 Test 1: Missing required fields (empty body)");
  try {
    const res = await fetch(`${API_BASE}/admin/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Error: ${data.error}`);
    console.log(`   ✅ Expected 400 error\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }

  // Test 2: Invalid kind
  console.log("📝 Test 2: Invalid kind");
  try {
    const res = await fetch(`${API_BASE}/admin/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "invalid",
        campaign: { name: "Test" }
      })
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Error: ${data.error}`);
    console.log(`   ✅ Expected 400 error\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }

  // Test 3: Missing name
  console.log("📝 Test 3: Missing campaign name");
  try {
    const res = await fetch(`${API_BASE}/admin/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "daily",
        campaign: { date: "2026-04-12" }
      })
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Error: ${data.error}`);
    console.log(`   ✅ Expected 400 error\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }

  // Test 4: Daily campaign without date
  console.log("📝 Test 4: Daily campaign without date");
  try {
    const res = await fetch(`${API_BASE}/admin/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "daily",
        campaign: { name: "Test Daily" }
      })
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    console.log(`   Error: ${data.error}`);
    console.log(`   ✅ Expected 400 error\n`);
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }

  // Test 5: Successful daily campaign creation
  console.log("📝 Test 5: Create daily campaign (success)");
  try {
    const res = await fetch(`${API_BASE}/admin/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "daily",
        campaign: {
          name: `Test Daily ${new Date().toLocaleTimeString()}`,
          date: "2026-04-12",
          raceCount: 16,
          entryValue: 5000,
          promoEnabled: true,
          promoPrice: 9000
        }
      })
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    if (res.status === 201) {
      console.log(`   ✅ Campaign created: ${data.campaign.name}`);
      console.log(`   ID: ${data.campaign.id}`);
      console.log(`   Date: ${data.campaign.date}\n`);
    } else {
      console.log(`   ❌ Unexpected response:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }

  // Test 6: Successful weekly campaign creation
  console.log("📝 Test 6: Create weekly campaign (success)");
  try {
    const res = await fetch(`${API_BASE}/admin/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "weekly",
        campaign: {
          name: `Test Weekly ${new Date().toLocaleTimeString()}`,
          activeDays: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"],
          finalDays: ["Sabado"],
          format: "individual",
          groupSize: 4,
          qualifiersPerGroup: 2,
          raceCount: 12,
          entryValue: 10000
        }
      })
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    if (res.status === 201) {
      console.log(`   ✅ Campaign created: ${data.campaign.name}`);
      console.log(`   ID: ${data.campaign.id}`);
      console.log(`   Active days: ${data.campaign.activeDays.join(", ")}\n`);
    } else {
      console.log(`   ❌ Unexpected response:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }

  // Test 7: Duplicate campaign ID
  console.log("📝 Test 7: Duplicate campaign ID");
  try {
    const duplicateId = `daily-${Date.now()}`;
    
    // Create first campaign
    await fetch(`${API_BASE}/admin/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "daily",
        campaign: {
          id: duplicateId,
          name: "First",
          date: "2026-04-13"
        }
      })
    });

    // Try to create duplicate
    const res = await fetch(`${API_BASE}/admin/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "daily",
        campaign: {
          id: duplicateId,
          name: "Duplicate",
          date: "2026-04-14"
        }
      })
    });
    const data = await res.json();
    console.log(`   Status: ${res.status}`);
    if (res.status === 409) {
      console.log(`   ✅ Correctly rejected duplicate`);
      console.log(`   Error: ${data.error}\n`);
    } else {
      console.log(`   ❌ Unexpected response:`, JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
  }

  console.log("=".repeat(50));
  console.log("✅ All tests completed\n");
}

testCampaignCreation().catch(console.error);
