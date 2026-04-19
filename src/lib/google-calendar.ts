import { prisma } from '@/lib/db';

// Función para sincronizar automáticamente un evento con Google Calendar
export async function syncEventToGoogleCalendar(eventData: {
  id: string;
  type: 'asesoria' | 'audiencia';
  title: string;
  description: string;
  start: Date;
  end: Date;
}) {
  try {
    // Solo sincronizar si estamos en producción o si se configura explícitamente
    if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_GOOGLE_CALENDAR_SYNC) {
      console.log('Google Calendar sync skipped (not in production)');
      return { success: true, skipped: true };
    }

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/configuraciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: eventData.title,
        description: eventData.description,
        start: eventData.start.toISOString(),
        end: eventData.end.toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to sync with Google Calendar:', response.statusText);
      return { success: false, error: 'Failed to sync with Google Calendar' };
    }

    const result = await response.json();

    if (result.success) {
      // Actualizar la base de datos con el eventId de Google
      if (eventData.type === 'asesoria') {
        await prisma.asesoria.update({
          where: { id: eventData.id },
          data: {
            googleEventId: result.event.id,
            sincronizadoGoogle: true,
          },
        });
      } else {
        await prisma.audiencia.update({
          where: { id: eventData.id },
          data: {
            googleEventId: result.event.id,
            sincronizadoGoogle: true,
          },
        });
      }

      console.log(`Event ${eventData.id} synced to Google Calendar: ${result.event.id}`);
      return { success: true, eventId: result.event.id };
    } else {
      console.error('Google Calendar API error:', result.error);
      return { success: false, error: result.error || 'Unknown error' };
    }
  } catch (error) {
    console.error('Error syncing event to Google Calendar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Función para preparar datos de asesoría para sincronización
export async function prepareAsesoriaForSync(asesoriaId: string) {
  const asesoria = await prisma.asesoria.findUnique({
    where: { id: asesoriaId },
    include: {
      lead: true,
      asesor: true,
    },
  });

  if (!asesoria) return null;

  const endDate = new Date(asesoria.fecha);
  endDate.setMinutes(endDate.getMinutes() + (asesoria.duracion || 60));

  return {
    id: asesoria.id,
    type: 'asesoria' as const,
    title: `Asesoría: ${asesoria.tema}`,
    description: `Cliente: ${asesoria.lead.nombre}\nAsesor: ${asesoria.asesor.nombre} ${asesoria.asesor.apellido}\nTipo: ${asesoria.tipo}\nModalidad: ${asesoria.modalidad}\nDuración: ${asesoria.duracion} minutos${asesoria.descripcion ? `\n\nDescripción: ${asesoria.descripcion}` : ''}`,
    start: asesoria.fecha,
    end: endDate,
  };
}

// Función para preparar datos de audiencia para sincronización
export async function prepareAudienciaForSync(audienciaId: string) {
  const audiencia = await prisma.audiencia.findUnique({
    where: { id: audienciaId },
    include: {
      caso: true,
      responsable: true,
    },
  });

  if (!audiencia) return null;

  const endDate = new Date(audiencia.fechaHora);
  endDate.setHours(endDate.getHours() + 1); // Asumir 1 hora de duración por defecto

  return {
    id: audiencia.id,
    type: 'audiencia' as const,
    title: `Audiencia: Caso ${audiencia.caso.numeroCaso}`,
    description: `Tipo: ${audiencia.tipo}\nCaso: ${audiencia.caso.numeroCaso}\nResponsable: ${audiencia.responsable.nombre} ${audiencia.responsable.apellido}\nModalidad: ${audiencia.modalidad}${audiencia.direccion ? `\nDirección: ${audiencia.direccion}` : ''}${audiencia.enlace ? `\nEnlace: ${audiencia.enlace}` : ''}${audiencia.observaciones ? `\n\nObservaciones: ${audiencia.observaciones}` : ''}`,
    start: audiencia.fechaHora,
    end: endDate,
  };
}