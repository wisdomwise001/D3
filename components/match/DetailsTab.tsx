import React, { memo } from "react";
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { getPlayerImageUrl } from "@/lib/api";

interface Incident {
  incidentType: string;
  text?: string;
  time?: number;
  addedTime?: number;
  player?: { shortName?: string; id?: number };
  playerName?: string;
  isHome?: boolean;
  incidentClass?: string;
  description?: string;
  playerIn?: { shortName?: string; id?: number };
  playerOut?: { shortName?: string; id?: number };
}

interface DetailsTabProps {
  eventId: string;
  venue?: string;
  city?: string;
  referee?: string;
  roundInfo?: string;
  tournamentName?: string;
}

interface RatedPlayer {
  player: { shortName?: string; id?: number };
  position: string;
  jerseyNumber: number;
  statistics: { rating?: number };
  isHome: boolean;
}

function DetailsTab({ eventId, venue, city, referee, roundInfo, tournamentName }: DetailsTabProps) {
  const { data: incidentsData, isLoading: incidentsLoading } = useQuery<{ incidents: Incident[] }>({
    queryKey: ["/api/event", eventId, "incidents"],
  });

  const { data: lineupsData } = useQuery<{
    home: { players: RatedPlayer[] };
    away: { players: RatedPlayer[] };
  }>({
    queryKey: ["/api/event", eventId, "lineups"],
  });

  const incidents = incidentsData?.incidents || [];
  const reversedIncidents = [...incidents].reverse();

  const allPlayers: RatedPlayer[] = [];
  if (lineupsData?.home?.players) {
    lineupsData.home.players.forEach((p: RatedPlayer) => allPlayers.push({ ...p, isHome: true }));
  }
  if (lineupsData?.away?.players) {
    lineupsData.away.players.forEach((p: RatedPlayer) => allPlayers.push({ ...p, isHome: false }));
  }

  const ratedPlayers = allPlayers
    .filter((p) => p.statistics?.rating)
    .sort((a, b) => (b.statistics.rating || 0) - (a.statistics.rating || 0));

  const playerOfMatch = ratedPlayers[0];
  const topRated = ratedPlayers.slice(0, 6);

  if (incidentsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {reversedIncidents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match Timeline</Text>
          {reversedIncidents.map((incident, index) => (
            <IncidentRow key={index} incident={incident} />
          ))}
        </View>
      )}

      {playerOfMatch && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player of the Match</Text>
          <View style={styles.potmCard}>
            <Image
              source={{ uri: getPlayerImageUrl(playerOfMatch.player?.id || 0) }}
              style={styles.potmImage}
              contentFit="cover"
              cachePolicy="disk"
            />
            <View style={styles.potmInfo}>
              <Text style={styles.potmName}>{playerOfMatch.player?.shortName}</Text>
              <Text style={styles.potmPosition}>{getPositionName(playerOfMatch.position)}</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>
                {(playerOfMatch.statistics.rating || 0).toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {topRated.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Highest Rated</Text>
          {topRated.map((p, i) => (
            <View key={i} style={styles.ratedRow}>
              <Image
                source={{ uri: getPlayerImageUrl(p.player?.id || 0) }}
                style={styles.ratedImage}
                contentFit="cover"
                cachePolicy="disk"
              />
              <Text style={styles.ratedName} numberOfLines={1}>
                {p.player?.shortName}
              </Text>
              <View
                style={[
                  styles.ratingBadgeSmall,
                  (p.statistics.rating || 0) >= 8 && styles.ratingBadgeHigh,
                ]}
              >
                <Text style={styles.ratingTextSmall}>
                  {(p.statistics.rating || 0).toFixed(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Match Info</Text>
        {tournamentName && <InfoRow icon="trophy-outline" label="Competition" value={tournamentName} />}
        {roundInfo && <InfoRow icon="layers-outline" label="Round" value={roundInfo} />}
        {venue && <InfoRow icon="location-outline" label="Venue" value={venue} />}
        {city && <InfoRow icon="business-outline" label="City" value={city} />}
        {referee && <InfoRow icon="person-outline" label="Referee" value={referee} />}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const IncidentRow = memo(({ incident }: { incident: Incident }) => {
  const { incidentType, time, addedTime, isHome } = incident;

  if (incidentType === "period") {
    return (
      <View style={styles.periodRow}>
        <View style={styles.periodLine} />
        <Text style={styles.periodText}>{incident.text || ""}</Text>
        <View style={styles.periodLine} />
      </View>
    );
  }

  if (incidentType === "injuryTime") {
    return (
      <View style={styles.injuryRow}>
        <Ionicons name="time-outline" size={14} color={Colors.dark.textTertiary} />
        <Text style={styles.injuryText}>{incident.addedTime}' added time</Text>
      </View>
    );
  }

  const timeStr = addedTime ? `${time}+${addedTime}'` : `${time}'`;

  const renderIcon = () => {
    if (incidentType === "goal") {
      return (
        <MaterialCommunityIcons
          name="soccer"
          size={16}
          color={Colors.dark.text}
        />
      );
    }
    if (incidentType === "card") {
      const isRed = incident.incidentClass === "red" || incident.incidentClass === "secondYellow";
      return (
        <View style={[styles.cardIcon, isRed ? styles.redCard : styles.yellowCard]}>
          {incident.incidentClass === "secondYellow" && (
            <View style={[styles.cardIconInner, styles.yellowCard]} />
          )}
        </View>
      );
    }
    if (incidentType === "substitution") {
      return (
        <View style={styles.subIconGroup}>
          <Ionicons name="arrow-up" size={12} color={Colors.dark.win} />
          <Ionicons name="arrow-down" size={12} color={Colors.dark.live} />
        </View>
      );
    }
    if (incidentType === "varDecision") {
      return <MaterialCommunityIcons name="monitor" size={16} color={Colors.dark.textSecondary} />;
    }
    return null;
  };

  const renderContent = () => {
    if (incidentType === "goal") {
      const name = incident.player?.shortName || incident.playerName || "";
      const desc = incident.description ? ` (${incident.description})` : "";
      return (
        <Text style={styles.incidentName} numberOfLines={1}>
          {name}{desc}
        </Text>
      );
    }
    if (incidentType === "card") {
      const name = incident.player?.shortName || incident.playerName || "";
      return (
        <Text style={styles.incidentName} numberOfLines={1}>
          {name}
        </Text>
      );
    }
    if (incidentType === "substitution") {
      return (
        <View style={styles.subNames}>
          <Text style={styles.subIn} numberOfLines={1}>
            {incident.playerIn?.shortName || ""}
          </Text>
          <Text style={styles.subOut} numberOfLines={1}>
            {incident.playerOut?.shortName || ""}
          </Text>
        </View>
      );
    }
    if (incidentType === "varDecision") {
      return (
        <Text style={styles.incidentName} numberOfLines={1}>
          {incident.description || "VAR Decision"}
        </Text>
      );
    }
    return null;
  };

  return (
    <View style={[styles.incidentRow, isHome ? styles.incidentHome : styles.incidentAway]}>
      {isHome ? (
        <>
          <Text style={styles.incidentTime}>{timeStr}</Text>
          {renderIcon()}
          {renderContent()}
        </>
      ) : (
        <>
          <View style={{ flex: 1 }} />
          {renderContent()}
          {renderIcon()}
          <Text style={styles.incidentTime}>{timeStr}</Text>
        </>
      )}
    </View>
  );
});

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={Colors.dark.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function getPositionName(pos: string) {
  switch (pos) {
    case "G": return "Goalkeeper";
    case "D": return "Defender";
    case "M": return "Midfielder";
    case "F": return "Forward";
    default: return pos;
  }
}

export default memo(DetailsTab);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  section: {
    backgroundColor: Colors.dark.card,
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
    padding: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
    marginBottom: 12,
  },
  periodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  periodLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.dark.border,
  },
  periodText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
    paddingHorizontal: 8,
  },
  injuryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 4,
  },
  injuryText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textTertiary,
  },
  incidentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  incidentHome: {},
  incidentAway: {
    flexDirection: "row",
  },
  incidentTime: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.textSecondary,
    width: 40,
    textAlign: "center",
  },
  incidentName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.text,
    flex: 1,
  },
  cardIcon: {
    width: 12,
    height: 16,
    borderRadius: 2,
  },
  cardIconInner: {
    position: "absolute",
    left: -3,
    top: 0,
    width: 12,
    height: 16,
    borderRadius: 2,
  },
  yellowCard: {
    backgroundColor: "#FFCC00",
  },
  redCard: {
    backgroundColor: "#E5383B",
  },
  subIconGroup: {
    flexDirection: "column",
    alignItems: "center",
  },
  subNames: {
    flex: 1,
    gap: 1,
  },
  subIn: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.win,
  },
  subOut: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  potmCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 8,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: 8,
  },
  potmImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.border,
  },
  potmInfo: {
    flex: 1,
    gap: 2,
  },
  potmName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.dark.text,
  },
  potmPosition: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
  },
  ratingBadge: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  ratedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  ratedImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.border,
  },
  ratedName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.text,
  },
  ratingBadgeSmall: {
    backgroundColor: Colors.dark.surfaceSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingBadgeHigh: {
    backgroundColor: Colors.dark.accent,
  },
  ratingTextSmall: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark.border,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.textSecondary,
    width: 100,
  },
  infoValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.dark.text,
    textAlign: "right",
  },
});
