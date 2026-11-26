export interface WaitlistEntry {
    id: number;
    position: number;
}

export interface WaitlistParticipant extends WaitlistEntry {
    name: string;
    firstname: string;
}
