---
name: unifi
description: "Beantwortet Fragen zu Jans Heimnetz über den UniFi-MCP-Server (UniFi Express 7): 'Wer hat gestern am meisten geladen?', 'Welches Gerät ist 192.168.10.x?', 'Ist was Neues im Netz?', 'Ist das Internet langsam?', 'Welche Portfreigaben / VLANs / Firewall-Regeln habe ich?'. Auch verwenden, wenn Jan Router, WLAN, Netzwerk, Traffic, Download, IP, MAC, VPN oder DNS erwähnt, ohne UniFi zu nennen."
---

# UniFi-Netz abfragen

Die Tools heißen `mcp__unifi__unifi_*` und werden per `ToolSearch` mit `select:` geladen, alle benötigten in einem Aufruf. Stand der Angaben: `unifi-network-mcp` 0.33.0, UniFi OS 5.2, Network 10.6.

## Grundregeln

- **Nur lesen.** Der MCP-Server meldet sich als View-Only-User `claude` an. Jede schreibende Aktion (create, update, delete, toggle, set, block, rename, reboot, trigger …) endet mit `403 Forbidden`. Nicht versuchen, sondern Jan sagen, wo er es in der Oberfläche ändert.
- Site ist immer `default`.
- Byte-Felder sind rohe Bytes. Für Jan in MB/GB umrechnen.
- Zeitformate sind uneinheitlich: `list_clients`, `lookup_by_ip`, `list_devices` liefern ISO (UTC), `get_client_details` Epoch-Sekunden, `list_events`, `get_anomalies`, `get_dashboard` Epoch-Millisekunden. Zeiten für Jan in Europe/Berlin angeben, das Datum per `date` prüfen.
- Der MAC-Parameter heißt je Tool anders:

| Tool | Parameter |
|---|---|
| `get_client_details` | `mac_address` |
| `get_client_stats` | `client_id` |
| `get_client_dpi_traffic`, `get_client_sessions`, `get_client_wifi_details` | `client_mac` |
| `get_switch_ports`, `get_port_stats` | `device_mac` |
| `recent_events` | `mac` |

## Netz-Kontext

Die vollständige Doku des Netzes (Netze, WLANs, Firewall, DNS, Reservierungen, Switch-Ports) steht im Obsidian-Wiki unter `Hardware/home-network-unifi.md` (`obsidian vault="Obsidian" read file="home-network-unifi"`). Bei Fragen zur Konfiguration zuerst dort nachsehen, bei Zweifeln live prüfen und die Seite aktualisieren.

- Gateway „JABASOFT-UE“ (UniFi Express 7, `192.168.1.1`), Switch USW-Lite-8-PoE (`0c:ea:14:c8:6d:de`).
- Netze: Default `192.168.1.0/24`, JABASOFT-IOT VLAN 10 (`192.168.10.0/24`), JABASOFT-HOME VLAN 20 (`192.168.20.0/24`), WireGuard JABASOFT-UE-WG (`192.168.2.0/24`).
- Alle lokalen DNS-Einträge `*.home.janbaer.de` sind CNAMEs auf `jabasoft-nixos-lxc-01`.
- Doppeltes NAT: Der WAN-Port hängt hinter der FritzBox (`192.168.178.99`).
- IoT-Trennung: JABASOFT-IOT hat „Isolate Network“ an, UniFi erzeugt dafür die vordefinierte Regel „Isolated Networks“ (BLOCK `192.168.10.0/24` → Internal, Index 30000). Die eigene Regel „Allow IOT return traffic“ (ALLOW, nur Antwortverkehr, Index 10000) lässt davor die Antworten durch. IoT kann also nur antworten, nie selbst ins HOME-Netz. Firewall-Fragen nie ohne `include_predefined=true` beurteilen, sonst fehlt die Isolation.
- `jabasoft-debian-vm-01` (192.168.20.14, K3s-Sandbox aus `proxmox-k3s-sandbox`) hat seit 2026-09-26 die feste MAC `BC:24:11:14:00:01`. Ältere Einträge `jabasoft-talos-vm-01` auf derselben IP sind Reste früherer Neuaufbauten.

## 1. Traffic: „Wer hat am meisten geladen?“

1. `get_top_clients` mit `duration` (`hourly`, `daily`, `weekly`, `monthly`) und `limit`. Liefert `mac`, `hostname`, `tx_bytes`, `rx_bytes`, `total_bytes`, sortiert.
2. Namen fehlen in der Antwort. Für die Top-Einträge `lookup_by_ip` oder `get_client_details` (`summary=true`) nachschieben.

Einschränkungen, die Jan in der Antwort erfahren muss:
- Es gibt **kein Kalenderfenster**. „Gestern“ heißt `daily` = die letzten 24 Stunden bis jetzt. So sagen.
- Ob `tx` Download oder Upload ist, ist nicht belegt. `total_bytes` nennen, die Richtung nur mit Vorbehalt.
- Die DPI-Tools (`get_client_dpi_traffic`, `get_site_dpi_traffic`, `get_dpi_stats`) liefern auf diesem Controller nichts. Nicht benutzen.
- Für einen einzelnen Client: `get_client_stats` (`client_id`, `duration`, `granularity`). Die Zeilen haben keinen Zeitstempel, nur die Summen (`total_*_bytes`) sind brauchbar.

## 2. „Welches Gerät ist das?“

1. Bei einer IP: `lookup_by_ip` (`ip_address`). Liefert `mac`, `hostname` und/oder `name`, `is_online`, `last_seen`.
2. Details: `get_client_details` mit `mac_address`, `summary=true`, `include=basic,network`. Wichtige Felder: `name`, `hostname`, `ip`, `network`, `vlan`, `use_fixedip`/`fixed_ip`, `local_dns_record`, `oui` (Hersteller), `first_seen`, `uptime`.
3. Die Fingerprint-Felder sind nur Zahlencodes und helfen nicht.
4. Ist das zweite Hex-Zeichen der MAC 2, 6, A oder E, ist sie zufällig vergeben (Handy, Tablet, Android-Geräte). Dann sagt der Hersteller nichts, Hinweise liefern Netz, Traffic-Menge und `first_seen`.

## 3. „Ist was Neues im Netz?“

1. `list_clients` mit `include_offline=true`, `limit=200`, `fields=mac,name,hostname,ip,first_seen,last_seen`. `first_seen` wird geliefert, obwohl es nicht in der Feldliste der Doku steht. Es fehlt bei manchen Einträgen.
2. Clientseitig nach `first_seen` sortieren und die Einträge der letzten Tage zeigen. Einträge ohne `name` hervorheben.
3. **Online-Status nie aus diesem Aufruf nehmen**, dort ist `status` immer `offline`. Für den Status ein zweiter `list_clients` ohne `include_offline`.
4. Es gibt kein Ereignis „neues Gerät“. `recent_events` enthält nur Ereignisse seit dem Start des MCP-Servers und ist praktisch leer.

## 4. „Ist das Internet langsam?“

1. `get_dashboard` (`history_seconds`, z. B. 86400). Die Ausgabe ist groß, relevant sind:
   - `wan.wan_details[].stats.service_latencies`: Latenz in ms zu Google, Cloudflare, Microsoft (normal etwa 20 bis 25 ms)
   - `isp.capabilities`: gebuchte Bandbreite
2. `list_events` mit `within_hours=168` und `event_type=ISP_HIGH_LATENCY_2`, danach `ISP_PACKET_LOSS_2`. Das ist die einzige echte Verlaufsquelle für Aussetzer.
3. `get_anomalies` (`duration`): Clients mit Problemen wie `USER_HIGH_TCP_LATENCY`.
4. `get_gateway_stats` (`duration`): `total_wan_rx_bytes`/`total_wan_tx_bytes`, `avg_cpu_pct`, `avg_mem_pct`. Hohe CPU spricht für ein Problem am Gateway.
5. `get_network_health` für den aktuellen Status je Subsystem (`wan`, `www`, `wlan`, `lan`, `vpn`).

Leer und nicht hilfreich: `get_speedtest_results` (es laufen keine Speedtests), `list_alarms`, `get_alerts`, `get_ips_events` (IPS ist aus).

## 5. „Was wurde blockiert?“ und Verbindungen im Verlauf

`get_traffic_flows` liefert echte Historie mit serverseitigen Filtern: `within_hours` (bis 8760) oder `time_from`/`time_to` (Epoch-ms), `action` (`allowed`/`blocked`), `source_network_id`, `source_ip`, `source_mac`, `destination_ip`, `destination_domain`, `search_text`, `page_size`.

- Blockierte Versuche aus dem IoT-Netz: `action=blocked`, `source_network_id=67fd4bc2dcf74a1e3c7f87ed`, `within_hours=720`.
- Felder je Flow: `time` (ms), `source`/`destination` mit `name`, `ip`, `network_name`, `zone_name`, `count`, `bytes_rx`, `policies[].internal_type` (`PREDEFINED_FIREWALL_RULE` = z. B. die Isolation).
- „Wohin telefoniert Gerät X?“: `source_mac` oder `source_ip`, die Zieldomains stehen in `destination.domains`.

## 6. Konfiguration nachschlagen

| Frage | Tool | Hinweis |
|---|---|---|
| Portfreigaben | `list_port_forwards` | |
| Firewall-Regeln | `list_firewall_policies` | immer mit `include_predefined=true`, eigene Regeln mit `summary=false` für `connection_state_type` |
| Netze / VLANs | `list_networks` | liefert die `_id`, mit der andere Tools auf Netze verweisen |
| WLANs | `list_wlans` | nennt nur `network_id`, Namen über `list_networks` auflösen |
| VPN | `list_vpn_servers`, `list_vpn_clients` | Server-Antwort enthält den Public Key, nicht ungefragt ausgeben |
| Lokale DNS-Namen | `list_dns_records` | kein Filter, selbst filtern |
| UniFi-Geräte, Firmware, Uptime | `list_devices` | `upgradable` zeigt verfügbare Updates |
| Switch-Ports | `get_switch_ports` (`device_mac`) | nur Port-Konfiguration, kein Link-Status |
| Feste IPs / Reservierungen | `get_client_details` je Client | es gibt keine Gesamtliste, bei vielen Clients vorher fragen |

Netz-IDs in Antworten immer über `list_networks` in Namen übersetzen, Jan kennt die IDs nicht.
